/**
 * browser-extensions.mjs — launch Chromium with the local uBlock Origin Lite build.
 *
 * Chrome extensions only load into a PERSISTENT context, so this returns either:
 *   - a BrowserContext (extension installed), or
 *   - a Browser (not installed — unchanged behaviour, zero setup required).
 *
 * Both expose newPage() and close(). A BrowserContext has no newContext(), so
 * callers that used browser.newContext() go through newLivenessPage() in
 * liveness-browser.mjs, which branches on that.
 *
 * Install the extension with: node ublock.mjs install
 */

import { mkdtempSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));

export const EXTENSION_DIR = resolve(ROOT, 'vendor', 'ublock-lite');

export function extensionInstalled() {
  return existsSync(join(EXTENSION_DIR, 'manifest.json'));
}

/**
 * @param {import('playwright').BrowserType} chromium
 * @param {{headless?: boolean, contextOptions?: object}} opts
 *        contextOptions are applied to the persistent context (userAgent, locale,
 *        ...). Ignored on the no-extension path, where callers still call
 *        browser.newContext() themselves.
 */
export async function launchBrowser(chromium, { headless = true, contextOptions = {} } = {}) {
  if (!extensionInstalled()) return chromium.launch({ headless });

  // ponytail: temp profile is left for the OS to reap. Add explicit cleanup only
  // if a long batch run starts filling the temp dir.
  const profileDir = mkdtempSync(join(tmpdir(), 'career-ops-chrome-'));

  return chromium.launchPersistentContext(profileDir, {
    // The bundled headless_shell binary cannot load extensions; the full
    // Chrome for Testing build (channel 'chromium') runs new headless and can.
    channel: 'chromium',
    headless,
    args: [
      `--disable-extensions-except=${EXTENSION_DIR}`,
      `--load-extension=${EXTENSION_DIR}`,
    ],
    ...contextOptions,
  });
}
