/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-shot Firestore collection rename script.
 *
 * Copies all top-level docs from old collection names into new collections
 * following our naming convention (camelCase, lowercase-first). Old
 * collections are NOT auto-deleted — verify the new collections look
 * correct via Firebase Console first, then delete the old ones manually.
 *
 * Renames performed:
 *   Users     → users
 *   cron_meta → cronMeta
 *
 * The script is idempotent: re-running on a partially-migrated state writes
 * the same data again (Firestore `set` overwrites). Safe to retry.
 *
 * Subcollections under each migrated doc are intentionally NOT copied — none
 * exist for `Users` or `cron_meta` per current code inspection. If you add
 * subcollections later, extend `copyCollection` accordingly.
 *
 * Usage:
 *   # If on Node 20+, prefer the built-in env file flag:
 *   node --env-file=.env.local scripts/migrate-firestore-collections.js
 *
 *   # Or set the credential env var inline:
 *   NEXT_PUBLIC_FIREBASE_CREDENTIALS_BASE64=... node scripts/migrate-firestore-collections.js
 *
 *   # Dry run (read only, no writes):
 *   node --env-file=.env.local scripts/migrate-firestore-collections.js --dry-run
 */

const admin = require('firebase-admin');

const credsB64 = process.env.NEXT_PUBLIC_FIREBASE_CREDENTIALS_BASE64;
if (!credsB64) {
  console.error(
    'ERROR: NEXT_PUBLIC_FIREBASE_CREDENTIALS_BASE64 is not set.\n' +
      'Run with `node --env-file=.env.local scripts/migrate-firestore-collections.js`.'
  );
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

const serviceAccount = JSON.parse(Buffer.from(credsB64, 'base64').toString('utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

/**
 * Copy every doc from `src` to `dest`, preserving doc IDs and field values.
 * Existing dest docs are overwritten via `set` (no merge — we want full
 * fidelity to source).
 */
async function copyCollection(src, dest) {
  console.log(`\n[${src} → ${dest}] reading source collection…`);
  const snap = await db.collection(src).get();
  if (snap.empty) {
    console.log(`  (source is empty — nothing to copy)`);
    return { copied: 0, skipped: 0 };
  }

  console.log(`  found ${snap.size} doc(s) in ${src}`);
  if (dryRun) {
    snap.forEach((d) => console.log(`    would copy: ${d.id}`));
    return { copied: 0, skipped: snap.size };
  }

  // Firestore batched writes max 500 ops — chunk to be safe even though we
  // realistically have <100 docs. Keeps the script robust if either
  // collection ever balloons.
  const docs = snap.docs;
  let copied = 0;
  const BATCH_SIZE = 400;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);
    chunk.forEach((d) => {
      batch.set(db.collection(dest).doc(d.id), d.data());
    });
    await batch.commit();
    copied += chunk.length;
    console.log(`  wrote batch ${i / BATCH_SIZE + 1} (${copied}/${docs.length})`);
  }
  return { copied, skipped: 0 };
}

async function main() {
  console.log(`Firestore collection migration${dryRun ? ' [DRY RUN]' : ''}`);
  console.log('================================');

  const usersResult = await copyCollection('Users', 'users');
  const cronResult = await copyCollection('cron_meta', 'cronMeta');

  console.log('\nSummary');
  console.log('-------');
  console.log(`Users    → users    : ${usersResult.copied} copied, ${usersResult.skipped} skipped`);
  console.log(`cron_meta → cronMeta : ${cronResult.copied} copied, ${cronResult.skipped} skipped`);

  if (dryRun) {
    console.log('\nDry run complete — no writes performed.');
  } else {
    console.log('\nMigration complete.');
    console.log('\nNEXT STEPS:');
    console.log('  1. Verify the new collections via Firebase Console.');
    console.log('  2. Deploy the updated app code (which reads/writes the new names).');
    console.log('  3. Manually DELETE the old collections (Users, cron_meta) from console.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
