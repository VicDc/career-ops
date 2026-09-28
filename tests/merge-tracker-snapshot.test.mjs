// tests/merge-tracker-snapshot.test.mjs — every tracker write is preceded by a
// snapshot of the previous state.
//
// The tracker is the one file in the project with no git history (`data/*` is
// gitignored), so a merge that resolves a row wrongly used to be unrecoverable
// except by hand — which is exactly what happened on 2026-09-08, when a fuzzy
// company+role match overwrote an existing row instead of adding a new one.
// writeTracker() copies the current on-disk state into <tracker dir>/backups/
// first, keeping the newest SNAPSHOT_KEEP files. That depth matches a
// user-layer backup script that is NOT in the repo (`/scripts/*.ps1` is
// gitignored — local operator tooling over personal data), so treat 20 as a
// plain constant defined in merge-tracker.mjs, not a cross-file contract.
//
// CLI integration, like tests/merge-tracker-sort.test.mjs: importing
// merge-tracker.mjs would run the merge at import time, so these drive the real
// script through the CAREER_OPS_TRACKER / CAREER_OPS_ADDITIONS overrides.
import { pass, fail, NODE, ROOT, rmSync } from './helpers.mjs';
import { join, basename } from 'path';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';

console.log('\nmerge-tracker.mjs — pre-write tracker snapshots');

// Must match SNAPSHOT_KEEP in merge-tracker.mjs. Asserted indirectly by the
// rotation test below: if the constant moves, that test names the new number.
const KEEP = 20;

const TRACKER_HEADER = [
  '# Applications Tracker',
  '',
  '| # | Date | Company | Role | Score | Status | PDF | Report | Notes |',
  '|---|------|---------|------|-------|--------|-----|--------|-------|',
  '',
].join('\n');

const row = (num, company) =>
  `| ${num} | 2026-01-01 | ${company} | Eng | 4.0/5 | Evaluated | ❌ | `
  + `[${num}](../reports/${num}-${String(company).toLowerCase()}-2026-01-01.md) | seeded |`;

// An out-of-order table guarantees a real write even with no pending additions:
// the table is sorted at write time (#3515), so the sort pass alone dirties the
// file. Without this the merge would short-circuit and never call writeTracker.
const UNSORTED = [row(4, 'Delta'), row(1, 'Alfa')];

/** Timestamp format mirrored from snapshotStamp() in merge-tracker.mjs. */
function stampOf(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    + `T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * Isolated workspace shaped like the standard layout: the tracker sits in
 * data/, so SNAPSHOT_DIR resolves to data/backups and the "outside data/"
 * warning stays quiet.
 */
function makeWorkspace(prefix) {
  const work = mkdtempSync(join(tmpdir(), prefix));
  const dataDir = join(work, 'data');
  const addsDir = join(work, 'adds');
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(addsDir, { recursive: true });
  return {
    work,
    tracker: join(dataDir, 'applications.md'),
    backups: join(dataDir, 'backups'),
    addsDir,
  };
}

/** Write the seed table and return the exact bytes on disk before the merge. */
function seedTracker(ws, rows = UNSORTED) {
  writeFileSync(ws.tracker, TRACKER_HEADER + rows.join('\n') + '\n');
  return readFileSync(ws.tracker, 'utf-8');
}

function runMerge(ws, args = []) {
  try {
    return execFileSync(NODE, [join(ROOT, 'merge-tracker.mjs'), ...args], {
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CAREER_OPS_TRACKER: ws.tracker, CAREER_OPS_ADDITIONS: ws.addsDir },
    });
  } catch (e) {
    return String(e.stdout ?? '') + String(e.stderr ?? '');
  }
}

const snapshots = ws => (existsSync(ws.backups) ? readdirSync(ws.backups).sort() : []);

try {
  // --- 1. a real write snapshots the PREVIOUS state ------------------------
  {
    const ws = makeWorkspace('cops-snap-basic-');
    try {
      const before = seedTracker(ws);
      runMerge(ws);
      const files = snapshots(ws);
      const after = readFileSync(ws.tracker, 'utf-8');

      if (files.length === 1) {
        pass('merge-tracker writes exactly one snapshot per run');
      } else {
        fail(`merge-tracker wrote ${files.length} snapshots, want 1: [${files.join(', ')}]`);
      }
      if (files.length && /^applications-\d{4}-\d{2}-\d{2}T\d{6}\.md$/.test(files[0])) {
        pass('snapshot is named applications-{YYYY-MM-DD}T{HHmmss}.md');
      } else {
        fail(`snapshot name off-format: ${files[0]}`);
      }
      if (files.length && readFileSync(join(ws.backups, files[0]), 'utf-8') === before) {
        pass('snapshot holds the pre-write bytes, not the post-write ones');
      } else {
        fail('snapshot does not match the tracker state that preceded the write');
      }
      // Guards the assertion above: if the merge stopped writing, "snapshot ===
      // before" would pass trivially because nothing ever changed.
      if (after !== before) {
        pass('the merge under test really rewrote the tracker');
      } else {
        fail('the merge wrote nothing, so the snapshot assertions prove nothing');
      }
    } finally {
      rmSync(ws.work, { recursive: true, force: true });
    }
  }

  // --- 2. --dry-run writes nothing, so it snapshots nothing ----------------
  {
    const ws = makeWorkspace('cops-snap-dry-');
    try {
      seedTracker(ws);
      runMerge(ws, ['--dry-run']);
      if (snapshots(ws).length === 0) {
        pass('--dry-run creates no snapshot');
      } else {
        fail(`--dry-run created snapshots: [${snapshots(ws).join(', ')}]`);
      }
    } finally {
      rmSync(ws.work, { recursive: true, force: true });
    }
  }

  // --- 3. rotation keeps the newest KEEP, deleting the oldest --------------
  {
    const ws = makeWorkspace('cops-snap-rotate-');
    try {
      mkdirSync(ws.backups, { recursive: true });
      // 25 seeded snapshots, all dated 2020 so they sort older than the one the
      // merge is about to take. 25 + 1 = 26, so 6 must go.
      const seeded = [];
      for (let i = 1; i <= 25; i++) {
        const name = `applications-2020-01-01T0000${String(i).padStart(2, '0')}.md`;
        writeFileSync(join(ws.backups, name), `seeded ${i}\n`);
        seeded.push(name);
      }
      seedTracker(ws);
      runMerge(ws);
      const files = snapshots(ws);

      if (files.length === KEEP) {
        pass(`rotation keeps exactly ${KEEP} snapshots`);
      } else {
        fail(`rotation left ${files.length} snapshots, want ${KEEP}`);
      }
      const removed = seeded.filter(n => !files.includes(n));
      const wantRemoved = seeded.slice(0, 6);
      if (removed.join(' ') === wantRemoved.join(' ')) {
        pass('rotation deletes the oldest snapshots first');
      } else {
        fail(`rotation deleted the wrong files: got [${removed.join(', ')}], want [${wantRemoved.join(', ')}]`);
      }
      if (files.some(n => n.startsWith('applications-2026') || !n.startsWith('applications-2020'))) {
        pass('the snapshot just taken survives its own rotation pass');
      } else {
        fail('rotation deleted the snapshot it had just written');
      }
    } finally {
      rmSync(ws.work, { recursive: true, force: true });
    }
  }

  // --- 4. two snapshots inside the same second do not overwrite ------------
  {
    const ws = makeWorkspace('cops-snap-collide-');
    try {
      mkdirSync(ws.backups, { recursive: true });
      // The merge's own clock decides the stamp, so pre-seed a file for every
      // second in a 10s window: whichever second it lands in, it collides and
      // must fall through to the .2 suffix. Ten entries stay well under KEEP,
      // so rotation cannot interfere with this assertion.
      const now = Date.now();
      const preseeded = new Set();
      for (let s = 0; s < 10; s++) {
        const name = `applications-${stampOf(new Date(now + s * 1000))}.md`;
        writeFileSync(join(ws.backups, name), 'SENTINEL\n');
        preseeded.add(name);
      }
      seedTracker(ws);
      runMerge(ws);

      const fresh = snapshots(ws).filter(n => !preseeded.has(n));
      if (fresh.length === 1 && /\.2\.md$/.test(fresh[0])) {
        pass('a same-second collision falls through to a .2 suffix');
      } else {
        fail(`same-second collision produced [${fresh.join(', ')}], want one .2.md file`);
      }
      if (fresh.length === 1) {
        // The file it collided with must be untouched: losing a prior snapshot
        // is the exact failure this suffix exists to prevent.
        const clashed = basename(fresh[0]).replace(/\.2\.md$/, '.md');
        const kept = existsSync(join(ws.backups, clashed))
          && readFileSync(join(ws.backups, clashed), 'utf-8') === 'SENTINEL\n';
        if (kept) {
          pass('the colliding snapshot is preserved, not overwritten');
        } else {
          fail(`the pre-existing snapshot ${clashed} was overwritten`);
        }
      }
    } finally {
      rmSync(ws.work, { recursive: true, force: true });
    }
  }

  // --- 5. --backfill-urls snapshots before it changes the schema -----------
  // Upstream's --backfill-urls wrote with writeFileAtomic() directly, which
  // would add the URL column with no copy of the table before it. The
  // 2026-09-28 merge routed it through writeTracker(); this keeps it there.
  {
    const ws = makeWorkspace('cops-snap-backfill-');
    try {
      const before = seedTracker(ws);
      runMerge(ws, ['--backfill-urls']);
      const files = snapshots(ws);
      const after = readFileSync(ws.tracker, 'utf-8');

      if (/\| URL \|/.test(after) && !/\| URL \|/.test(before)) {
        pass('--backfill-urls added the URL column');
      } else {
        fail('--backfill-urls did not add the URL column, so the snapshot assertion proves nothing');
      }
      if (files.length === 1 && readFileSync(join(ws.backups, files[0]), 'utf-8') === before) {
        pass('--backfill-urls snapshots the pre-migration table');
      } else {
        fail(`--backfill-urls left [${files.join(', ')}], want one snapshot of the pre-migration table`);
      }
    } finally {
      rmSync(ws.work, { recursive: true, force: true });
    }
  }
} catch (e) {
  fail(`merge-tracker snapshot tests crashed: ${e.message}`);
}
