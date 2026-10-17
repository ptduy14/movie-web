/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-shot wipe of the collections keyed by the old catalog's ids.
 *
 * Why this exists
 * ---------------
 * Every record below is keyed by the PREVIOUS catalog's ids. It has run
 * twice now:
 *
 *   - v2.0.0 (2026-09): the v1 provider `_id`s / slugs → TMDB keys (`movie-68721`).
 *   - v3.0.0 (2026-10): TMDB keys → the catalog `_id`s (32-hex) and slugs
 *     (`nha-ngoai-giao-phan-4`). Decided:
 *     wipe rather than migrate — a TMDB key maps to a catalog title for at
 *     most ~78% of records, and a series key maps to SEVERAL titles (the catalog
 *     lists each season separately), so a migration would be partial and
 *     partly wrong.
 *
 * After a catalog switch none of these documents is read again. They are
 * not stale data, they are unreachable data, and leaving them mixes two
 * incompatible key schemes in the same collections forever.
 *
 * `users` is NOT touched. Accounts, profiles and credentials carry no catalog
 * id and stay exactly as they are.
 *
 * What gets deleted
 * -----------------
 *   translations       machine-translated synopses, keyed by old movie id
 *                      (v2 cached vi; v3 caches en under the catalog ids)
 *   cronMeta           the translation cron's page cursor (now meaningless:
 *                      it points into a catalog that no longer exists)
 *   recentMovies       watch history / continue-watching
 *   movies             legacy per-movie docs
 *   userMovies         saved collections
 *   movieComments      comments, plus their `comments` subcollection
 *   userNotifications  notifications, plus their `notifications` subcollection
 *
 * Safety
 * ------
 * Dry run is the DEFAULT. Nothing is deleted unless you pass `--confirm`.
 * There is no undo — take a Firestore export first if you want one.
 *
 * Usage:
 *   # See what would go (safe, read-only):
 *   node --env-file=.env scripts/wipe-legacy-collections.js
 *
 *   # Actually delete:
 *   node --env-file=.env scripts/wipe-legacy-collections.js --confirm
 *
 *   # Limit to specific collections:
 *   node --env-file=.env scripts/wipe-legacy-collections.js --only=translations,cronMeta --confirm
 *
 *   # Cap the documents touched in one run (default 18000):
 *   node --env-file=.env scripts/wipe-legacy-collections.js --confirm --max=5000
 *
 * Quota
 * -----
 * The project is on Firestore's free tier: 50,000 reads and 20,000 deletes a
 * day, shared with the live site. Every document deleted is also read once
 * to find it, so one run stops at `--max` documents (default 18,000, under
 * the delete cap) and the rest goes in tomorrow's run. Re-running is safe:
 * each run starts from whatever is left. Small, user-facing collections go
 * first, `translations` (the bulk) last.
 *
 * Run it in a quiet hour — a run that eats the daily quota also takes the
 * live site's Firestore reads down until the quota resets (midnight Pacific).
 */

const admin = require('firebase-admin');

const credsB64 = process.env.FIREBASE_CREDENTIALS_BASE64;
if (!credsB64) {
  console.error(
    'ERROR: FIREBASE_CREDENTIALS_BASE64 is not set.\n' +
      'Run with `node --env-file=.env scripts/wipe-legacy-collections.js`.'
  );
  process.exit(1);
}

const confirmed = process.argv.includes('--confirm');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const maxArg = process.argv.find((a) => a.startsWith('--max='));
const MAX_DOCS = maxArg ? Math.max(1, parseInt(maxArg.slice('--max='.length), 10) || 0) : 18000;
const only = onlyArg ? onlyArg.slice('--only='.length).split(',').map((s) => s.trim()) : null;

const serviceAccount = JSON.parse(Buffer.from(credsB64, 'base64').toString('utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

/**
 * Collections to clear, with the subcollections that hang off each document.
 *
 * Firestore does not delete subcollections when the parent document goes —
 * the children become orphans that still cost storage and still show up in
 * collection-group queries. Naming them here is what makes the wipe complete.
 */
const TARGETS = [
  { name: 'cronMeta', subcollections: [] },
  { name: 'recentMovies', subcollections: [] },
  { name: 'movies', subcollections: [] },
  { name: 'userMovies', subcollections: [] },
  { name: 'movieComments', subcollections: ['comments'] },
  { name: 'userNotifications', subcollections: ['notifications'] },
  // The bulk (~33k docs) last, so the small collections never wait on it.
  { name: 'translations', subcollections: [] },
];

/** Page size for reading document refs. */
const PAGE_SIZE = 500;

/** Documents read or deleted so far this run, against MAX_DOCS. */
let budgetUsed = 0;

/** Firestore caps a batched write at 500 operations. */
const BATCH_LIMIT = 450;

async function deleteDocs(refs) {
  let deleted = 0;
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += Math.min(BATCH_LIMIT, refs.length - i);
  }
  return deleted;
}

/**
 * Wipe one collection page by page, within the run's document budget.
 *
 * Pages are read with an empty field mask (`select()`), which still bills
 * one read per document but transfers nothing — the refs are all we need.
 * Dry run counts without deleting (and still spends reads, so it is
 * budgeted too).
 */
async function wipeCollection({ name, subcollections }) {
  let docs = 0;
  let subDocs = 0;
  let cursor = null;

  while (budgetUsed < MAX_DOCS) {
    const pageSize = Math.min(PAGE_SIZE, MAX_DOCS - budgetUsed);
    let query = db.collection(name).orderBy('__name__').select().limit(pageSize);
    // A dry run must page past what it counted; a real run deletes what it
    // read, so the next page is simply the first page again.
    if (!confirmed && cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    if (snapshot.empty) break;
    budgetUsed += snapshot.size;

    const docRefs = snapshot.docs.map((d) => d.ref);
    let subDocRefs = [];
    for (const sub of subcollections) {
      const perDoc = await Promise.all(
        docRefs.map(async (ref) => (await ref.collection(sub).select().get()).docs.map((d) => d.ref))
      );
      subDocRefs = subDocRefs.concat(perDoc.flat());
    }
    budgetUsed += subDocRefs.length;

    if (confirmed) {
      // Children first: a crash between the two passes should leave orphaned
      // parents (harmless, re-runnable) rather than orphaned children
      // (invisible to a re-run, because the parent that named them is gone).
      subDocs += await deleteDocs(subDocRefs);
      docs += await deleteDocs(docRefs);
    } else {
      subDocs += subDocRefs.length;
      docs += docRefs.length;
      cursor = snapshot.docs[snapshot.docs.length - 1];
    }
    if (snapshot.size < pageSize) break;
  }

  const verb = confirmed ? 'deleted' : 'would delete';
  const more = budgetUsed >= MAX_DOCS ? ' (stopped at --max; run again for the rest)' : '';
  console.log(
    `  ${name.padEnd(20)} ${docs || subDocs ? `${verb} ${docs} doc(s)` : 'empty — nothing to do'}` +
      (subDocs ? ` + ${subDocs} subcollection doc(s)` : '') +
      more
  );
  return { docs, subDocs };
}

(async () => {
  const targets = only ? TARGETS.filter((t) => only.includes(t.name)) : TARGETS;

  if (only) {
    const unknown = only.filter((n) => !TARGETS.some((t) => t.name === n));
    if (unknown.length) {
      console.error(`ERROR: unknown collection(s) in --only: ${unknown.join(', ')}`);
      process.exit(1);
    }
  }

  console.log(
    confirmed
      ? '\nDELETING legacy collections (this cannot be undone)\n'
      : '\nDRY RUN — nothing will be deleted. Re-run with --confirm to apply.\n'
  );

  let totalDocs = 0;
  let totalSubDocs = 0;
  for (const target of targets) {
    if (budgetUsed >= MAX_DOCS) {
      console.log(`  ${target.name.padEnd(20)} skipped — run budget (--max=${MAX_DOCS}) used up`);
      continue;
    }
    try {
      const { docs, subDocs } = await wipeCollection(target);
      totalDocs += docs;
      totalSubDocs += subDocs;
    } catch (err) {
      console.error(`  ${target.name.padEnd(20)} FAILED: ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log(
    `\n${confirmed ? 'Deleted' : 'Would delete'} ${totalDocs} document(s)` +
      (totalSubDocs ? ` and ${totalSubDocs} subcollection document(s)` : '') +
      '.\n`users` was not touched.\n'
  );
  process.exit(process.exitCode ?? 0);
})();
