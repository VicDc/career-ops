#!/usr/bin/env node
/**
 * ublock.mjs — install and version-check the uBlock Origin Lite build that
 * Playwright loads (see browser-extensions.mjs).
 *
 * Usage:
 *   node ublock.mjs check     # JSON: installed version vs latest upstream
 *   node ublock.mjs install   # download the latest release and unpack it
 *
 * Source: https://github.com/uBlockOrigin/uBOL-home/releases — the project's
 * own release page. The Chrome Web Store link cannot be used directly:
 * Playwright needs an unpacked extension directory, and the store serves a
 * signed CRX only to the browser itself.
 *
 * The extension lands in vendor/ublock-lite/ (gitignored, not committed).
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, renameSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const EXTENSION_DIR = resolve(ROOT, 'vendor', 'ublock-lite');
const RELEASE_API = 'https://api.github.com/repos/uBlockOrigin/uBOL-home/releases/latest';
const ASSET_RE = /^uBOLite_.*\.chromium\.mv3\.zip$/;

function installedVersion() {
  const manifest = join(EXTENSION_DIR, 'manifest.json');
  if (!existsSync(manifest)) return null;
  try {
    return JSON.parse(readFileSync(manifest, 'utf-8')).version ?? null;
  } catch {
    return null;
  }
}

async function latestRelease() {
  const res = await fetch(RELEASE_API, {
    headers: { 'User-Agent': 'career-ops', Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
  const json = await res.json();
  const asset = (json.assets ?? []).find((a) => ASSET_RE.test(a.name));
  if (!asset) throw new Error(`No asset matching ${ASSET_RE} in release ${json.tag_name}`);
  return {
    // Tag looks like "uBOLite_2026.7.24.1010"; the manifest version is the numeric tail.
    version: String(json.tag_name).replace(/^uBOLite_/, ''),
    tag: json.tag_name,
    assetName: asset.name,
    assetUrl: asset.browser_download_url,
    assetSizeKB: Math.round(asset.size / 1024),
  };
}

// bsdtar (Windows 10+, macOS) reads zip; GNU tar does not, so fall back to unzip.
function extractZip(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true });
  try {
    execFileSync('tar', ['-xf', zipPath, '-C', destDir], { stdio: 'pipe' });
  } catch {
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', destDir], { stdio: 'pipe' });
  }
}

// Some releases wrap everything in a single top-level folder. Flatten it so
// manifest.json always sits at the root of EXTENSION_DIR.
function flattenIfNested(dir) {
  if (existsSync(join(dir, 'manifest.json'))) return;
  const entries = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());
  const inner = entries.find((e) => existsSync(join(dir, e.name, 'manifest.json')));
  if (!inner) throw new Error(`manifest.json not found in the extracted archive at ${dir}`);
  for (const entry of readdirSync(join(dir, inner.name))) {
    renameSync(join(dir, inner.name, entry), join(dir, entry));
  }
  rmSync(join(dir, inner.name), { recursive: true, force: true });
}

async function check() {
  const local = installedVersion();
  let remote;
  try {
    remote = await latestRelease();
  } catch (err) {
    console.log(JSON.stringify({ status: 'offline', installed: local, error: err.message }));
    return;
  }
  const status = !local ? 'not-installed' : local === remote.version ? 'up-to-date' : 'update-available';
  console.log(JSON.stringify({
    status,
    installed: local,
    latest: remote.version,
    tag: remote.tag,
    asset: remote.assetName,
    assetSizeKB: remote.assetSizeKB,
    dir: EXTENSION_DIR,
  }, null, 2));
}

async function install() {
  const remote = await latestRelease();
  console.log(`Downloading ${remote.assetName} (${remote.assetSizeKB} KB) from ${remote.assetUrl}`);

  const res = await fetch(remote.assetUrl, { headers: { 'User-Agent': 'career-ops' } });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const zipPath = join(tmpdir(), remote.assetName);
  writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));

  rmSync(EXTENSION_DIR, { recursive: true, force: true });
  extractZip(zipPath, EXTENSION_DIR);
  flattenIfNested(EXTENSION_DIR);
  rmSync(zipPath, { force: true });

  const local = installedVersion();
  if (!local) throw new Error('Extraction finished but manifest.json has no version');
  console.log(`Installed uBlock Origin Lite ${local} into ${EXTENSION_DIR}`);
  console.log('Playwright will load it automatically on the next browser launch.');
}

const cmd = process.argv[2] || 'check';
try {
  if (cmd === 'check') await check();
  else if (cmd === 'install') await install();
  else {
    console.log('Usage: node ublock.mjs [check|install]');
    process.exit(1);
  }
} catch (err) {
  console.error(`ublock.mjs ${cmd} failed: ${err.message}`);
  process.exit(1);
}
