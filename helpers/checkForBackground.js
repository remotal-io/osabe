import { existsSync } from 'fs'
import path from 'path';

const findServiceWorker = function serviceWorkerFinder(
  /** @type {import('..').Builder["log"]} */ logger,
  /** @type {string} */ serviceWorkerLocation,
  /** @type {string} */ name,
  /** @type {import('../').Platform} */ platform,
  ) {
  
  const files = [
    serviceWorkerLocation + '.js',
    serviceWorkerLocation + '.ts',
    path.join(serviceWorkerLocation, 'index.js'),
    path.join(serviceWorkerLocation, 'index.ts'),
  ]; 
  const file = files.find(f => existsSync(f));
  if (!file) {
    const manifestConfig = 
      platform === 'chrome' ?
      `The file pointed by \`config.files.serviceWorker\` (currently set to "${serviceWorkerLocation}") will be used as \`background.service_worker\` - see https://developer.chrome.com/docs/extensions/mv3/service_workers/#manifest for more info.`
      :
      `The file pointed by \`config.files.serviceWorker\` (currently set to "${serviceWorkerLocation}") will be used as \`background.scripts\` - see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background for more info.`
    logger.error(
      `${name}: "${serviceWorkerLocation}" not found.
  - Make sure one of the following files exists or set \`config.files.serviceWorker\` to point to the right location - See https://kit.svelte.dev/docs/configuration#files for more info.
${manifestConfig}.
` + files.map( file => `    - ${file.split(path.sep).join(path.posix.sep)}` ).join('\n')
    );
    throw new Error('Service worker not found.')
  }
}

export default function checkForBackground(
  /** @type {import('..').Builder} */ builder,
  /** @type {string} */ name,
  /** @type {import('../').Platform} */ platform,
) {

  const serviceWorkerLocation = path.relative('.', builder.config.kit.files?.serviceWorker);
  findServiceWorker(builder.log, serviceWorkerLocation, name, platform);

  if (builder.config.kit.serviceWorker?.register !== false) {
    const manifestConfig = 
      platform === 'chrome' ?
      `the file pointed by \`config.files.serviceWorker\` (currently set to "${serviceWorkerLocation}") will be used as \`background.service_worker\` - see https://developer.chrome.com/docs/extensions/mv3/service_workers/#manifest for more info.`
      :
      `the file pointed by \`config.files.serviceWorker\` (currently set to "${serviceWorkerLocation}") will be used as \`background.scripts\` - see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background for more info.`
    builder.log.error(
      `${name}: \`serviceWorker.register\` must be set to false.
Setting this value to false will disable automatic registration in svelteKit (https://kit.svelte.dev/docs/configuration#serviceworker).
In the generated webextension manifest.json, ${manifestConfig}.`
    );
    throw new Error('Service worker automatic registration not disabled.')
  }

  return;
}
