/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-shot wipe of the collections keyed by the old catalog's ids.
 *
 * Why this exists
 * ---------------
 * Every record below is keyed by the previous provider's MongoDB `_id` or its
 * slug. The catalog is now TMDB, whose keys look like `movie-68721` — so not
 * one of these documents will ever be read again. They are not stale data,
 * they are unreachable data, and leaving them mixes two incompatible key
 * schemes in the same collections forever.
 *
 * `users` is NOT touched. Accounts, profiles and credentials carry no catalog
 * id and stay exactly as they are.
 *
 * What gets deleted
 * -----------------
 *   translations       machine-translated synopses, keyed by old movie id
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
 */

const admin = require('firebase-admin');

const credsB64 = process.env.NEXT_PUBLIC_FIREBASE_CREDENTIALS_BASE64;
if (!credsB64) {
  console.error(
    'ERROR: NEXT_PUBLIC_FIREBASE_CREDENTIALS_BASE64 is not set.\n' +
      'Run with `node --env-file=.env scripts/wipe-legacy-collections.js`.'
  );
  process.exit(1);
}

const confirmed = process.argv.includes('--confirm');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
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
  { name: 'translations', subcollections: [] },
  { name: 'cronMeta', subcollections: [] },
  { name: 'recentMovies', subcollections: [] },
  { name: 'movies', subcollections: [] },
  { name: 'userMovies', subcollections: [] },
  { name: 'movieComments', subcollections: ['comments'] },
  { name: 'userNotifications', subcollections: ['notifications'] },
];

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

async function wipeCollection({ name, subcollections }) {
  const snapshot = await db.collection(name).get();
  if (snapshot.empty) {
    console.log(`  ${name.padEnd(20)} empty — nothing to do`);
    return { docs: 0, subDocs: 0 };
  }

  const docRefs = snapshot.docs.map((d) => d.ref);
  let subDocRefs = [];

  for (const sub of subcollections) {
    const perDoc = await Promise.all(
      docRefs.map(async (ref) => (await ref.collection(sub).get()).docs.map((d) => d.ref))
    );
    subDocRefs = subDocRefs.concat(perDoc.flat());
  }

  if (!confirmed) {
    console.log(
      `  ${name.padEnd(20)} would delete ${docRefs.length} doc(s)` +
        (subDocRefs.length ? ` + ${subDocRefs.length} subcollection doc(s)` : '')
    );
    return { docs: docRefs.length, subDocs: subDocRefs.length };
  }

  // Children first: a crash between the two passes should leave orphaned
  // parents (harmless, re-runnable) rather than orphaned children (invisible
  // to a re-run, because the parent that named them is gone).
  const subDeleted = await deleteDocs(subDocRefs);
  const deleted = await deleteDocs(docRefs);
  console.log(
    `  ${name.padEnd(20)} deleted ${deleted} doc(s)` +
      (subDeleted ? ` + ${subDeleted} subcollection doc(s)` : '')
  );
  return { docs: deleted, subDocs: subDeleted };
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
