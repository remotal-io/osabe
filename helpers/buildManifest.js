import { open, access } from 'fs/promises'
import { constants } from 'fs'
import path from 'path';
import listFolder from './listFolder.js'


const swFile = 'service-worker.js';
const optPage = 'options_ui.html';
const actionPage = 'action.html';
const sidebarActionPage = 'sidebar_action.html';
const defaultManifest = {
  "name": "Awesome Extension",
  "short_name": "Awesome Extension",
  "version": "0.0.0",
  "description": "An awesome new browser extension",
  "homepage_url": "https://github.com/remotal-io/opinionated-sveltekit-adapter-browser-extension",
  "manifest_version": 3,
  "icons": {
    "128": "icon.png"
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore hide this error
  "permissions": [],
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore hide this error
  "host_permissions": [],
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore hide this error
  "content_scripts": [],
  "options_ui": {
    "browser_style": false,
    "page": optPage,
    "open_in_tab": false,
  },
  "action": {
    "browser_style": false,
    "default_icon": {
      "16": "icons/favicon.png",
      "32": "icons/favicon.png",
    },
    "default_title": "default_title_action",
    "default_popup": actionPage,
    "theme_icons": [{
      "light": "icons/favicon.png",
      "dark": "icons/favicon.png",
      "size": 16
    },{
      "light": "icons/favicon.png",
      "dark": "icons/favicon.png",
      "size": 32
    }]
  },
  "content_security_policy": {
    "extension_pages": "default-src 'self'"
  }
}

function initializeChromeManifest(
/** @type {typeof defaultManifest} */ defaultValue
) {
  return {
    ...defaultValue,
    "minimum_chrome_version": "102",
    "background": {
      "service_worker": swFile,
      // "type": "module"
    }
  };
}
function initializeMozillaManifest(
/** @type {typeof defaultManifest} */ defaultValue
) {
  return {
    ...defaultValue,
    "background": {
      "scripts": [ swFile ],
    },
    "browser_specific_settings": {
      "gecko": {
        "id": "awesome-extension@notlmn.github.io",
        "strict_min_version": "102.0"
      }
    },
    "sidebar_action": {
      "default_icon": {
        "16": "icons/favicon.png",
        "32": "icons/favicon.png",
        },
      "default_title": "My sidebar",
      "default_panel": sidebarActionPage,
      "open_at_install": true
    },  
  };
}
async function pageExists(
  /** @type {import('..').Struct} */ struct,
  /** @type {string} */ filePath,
) {
  const absolutePath = path.join(struct.pagesPath.absolute, filePath);
  const exists = await access(absolutePath, constants.R_OK)
    .then( () => true )
    .catch( () => false )
  return exists;
}

function optPageExists(
  /** @type {import('..').Struct} */ struct,
) {
  return pageExists(struct, optPage);
}

function actionPageExists(
  /** @type {import('..').Struct} */ struct,
) {
  return pageExists(struct, actionPage);
}
  
function sidebarActionPageExists(
  /** @type {import('..').Struct} */ struct,
) {
  return pageExists(struct, sidebarActionPage);
}

function listWebAccessibleResources(
  /** @type {import('..').Struct} */ struct,
) {
  const baseDir = path.join(struct.pagesPath.absolute, struct.options.in.webAccessibleResources);
  return listFolder(baseDir).then(files => {
    return files.map(filePath => {
      return path.relative(struct.pagesPath.absolute, filePath);
    });
  });
}

function addWebAccessibleResources(
  /** @type {string[]} */ files,
  /** @type {typeof defaultManifest} */ defaultValue
) {
  return {
    ...defaultValue,
    "web_accessible_resources": [{
        "resources": files,
        "matches": [ "*://*/*" ],
        "use_dynamic_url": false
    }]
  };
}

function listAllAssets(
  /** @type {import('..').Struct} */ struct,
) {
  return listFolder(struct.tmpPath, true)
    .then(files => {
      return files.map(filePath => {
        let p = path.relative(struct.tmpPath, filePath);
        if (p.endsWith(struct.serviceWorkerFileName)) return null;
        if (struct.assetsPath.absolute !== struct.pagesPath.absolute) {
          p = path.join(struct.assetsPath.relative, p);
        }
        return p;
      });
    })
    .then(paths => paths.filter(Boolean));
}

async function getHydrationScriptRelativePath(
  /** @type {string} */ filePath,

) {
  const fh = await open(filePath, 'r+');
  const content = await fh.readFile('utf-8');
  const promise = fh.close();
  const [, src] = content.match(/data-osabe\ssrc="(\/osabe_[a-zA-Z0-9]+.js)"/);
  return promise.then(() => src);
}

function listAllWARExternalizedScripts(
  /** @type {import('..').Struct} */ struct,
) {
  const absPath = path.join(struct.pagesPath.absolute, struct.options.in.webAccessibleResources);
  return listFolder(absPath, true)
    .then(files => {
      return Promise.all(files.map(filePath => getHydrationScriptRelativePath(filePath)));
    })
    .then(paths => paths.filter(Boolean));
}

function listOnlyStaticAssets(
    /** @type {import('..').Struct} */ struct,
) {
  return listFolder(struct.tmpPath, true)
    .then(files => {
      return files.map(filePath => {
        let p = path.relative(struct.tmpPath, filePath);
        if (p.endsWith(struct.serviceWorkerFileName) ||
            p.endsWith('vite-manifest.json') ||
            p.startsWith(struct.appPath)
        ) {
          return null;
        }
        if (struct.assetsPath.absolute !== struct.pagesPath.absolute) {
          p = path.join(struct.assetsPath.relative, p)
        }
        return p;
      });
    })
    .then(paths => paths.filter(Boolean));
}


async function initializeManifest(
  /** @type {import('..').Struct} */ struct,
) {
  /** @type {typeof defaultManifest} */
  let manifest;
  /** @type {string[]} */
  const warList = [];
  const removeOptionUI = (await optPageExists(struct)) === false;
  const removeActionPage = (await actionPageExists(struct)) === false;
  const removeSidebarActionPage = (await sidebarActionPageExists(struct)) === false;

  if (struct.platform === 'mozilla') {
    manifest = initializeMozillaManifest(defaultManifest)
  } else if (struct.platform === 'chrome') {
    manifest = initializeChromeManifest(defaultManifest)
  }
  if (removeOptionUI) delete manifest["options_ui"];
  if (removeActionPage) {
    delete manifest["action"]['default_title'];
    delete manifest["action"]['default_popup'];
    delete manifest["action"]['theme_icons'];

  }
  // @ts-expect-error Indeed, key sidebar_action is added in initializeMozillaManifest(struct)
  if (struct.platform === 'mozilla' && removeSidebarActionPage) delete manifest["sidebar_action"];
  warList.push(...await listWebAccessibleResources(struct));
  if (warList.length > 0) {
    warList.push(...await listAllAssets(struct));
    warList.push(...await listAllWARExternalizedScripts(struct));
  } else {
    warList.push(...await listOnlyStaticAssets(struct));
  }
  if (warList.length > 0) manifest = addWebAccessibleResources(warList, manifest);
  return manifest;
}

function checkNameAndShortName(
  /** @type {import('..').Struct} */ struct,
  /** @type {string} */ name,
  /** @type {string} */ shortName,
) {
  if (!name || name.length < 1 || name.length > 45) {
    struct.builder.log.warn(
      `${struct.adapterName}: The \`${struct.platform}/manifest.json->'name'\` property is a short, plain text string (maximum of 45 characters) that identifies the extension (currently: ${name?.length || 0} chars).`
    );
  }
  if (!shortName || name.length < 1 || shortName.length > 12) {
    struct.builder.log.warn(
      `${struct.adapterName}: It's recommended that the \`${struct.platform}/manifest.json->'short_name'\` property should not exceed 12 characters (currently: ${shortName?.length || 0} chars).`
    );
  }
}

function checkMinimumChromeVersion(
  /** @type {import('..').Struct} */ struct,
  /** @type {string | number} */ minimum_chrome_version
) {
  if (struct.platform === 'chrome' && typeof(minimum_chrome_version) !== 'string' ) {
    struct.builder.log.error(
      `${struct.adapterName}: The \`${struct.platform}/manifest.json->'minimum_chrome_version'\` property must be a string (currently: ${typeof(minimum_chrome_version)}).`
    );
  }
}

export default async function buildManifest(
  /** @type {import('..').Struct} */ struct,
) {
  /** @type {typeof defaultManifest} */
  const initialManifest = await initializeManifest(struct);
  /** @type {typeof defaultManifest} */
  const manifest = struct.options.manifestBuilder ? struct.options.manifestBuilder(initialManifest, struct.platform) : initialManifest;
  checkNameAndShortName(struct, manifest.name, manifest.short_name);
  checkMinimumChromeVersion(struct, manifest.minimum_chrome_version);
  return JSON.stringify(manifest, null, 2);
}
