import { open, writeFile } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import sjcl from 'sjcl'
import listFolder from './listFolder.js'

function getHTMLFiles(
  /** @type {string} */ pages
) {
  return listFolder(pages, true)
    .then(files => {
      return files.map(filePath => {
        if (!filePath.endsWith('.html')) return null;
        return filePath;
      });
    })
    .then(paths => paths.filter(Boolean));
}

function hashString(
  /** @type {string} */ str
) {
	const hashed = sjcl.hash.sha256.hash(str);
	return sjcl.codec.base64.fromBits(hashed);
}

function createFile(
  /** @type {string} */ filePath,
  /** @type {string} */ content
) {
  return writeFile(filePath, content, {
    encoding: 'utf8',
    flag: constants.O_CREAT | constants.O_TRUNC | constants.O_WRONLY,
  })
  .catch(e => {
    throw new Error(`Failed trying to write ${filePath}\n${e.message}`)
  });
}

function externalizeScript(
  /** @type {string} */ html,
  /** @type {import('..').Struct} */ struct,
  ) {
  /** @type {Promise<void>[]} */
  const promises = [];

  const replaceValue = html.replace(
    /(?=<body)(.|\s)*(?<=<\/body>)/,
    (body) => {
      return body.replace(
        /<script\s*(?:(?:data-sveltekit-hydrate="?(?<ida>[a-zA-Z0-9]+)"?)|(?:type="?module"?))?\s*(?:(?:type="?module"?)|(?:data-sveltekit-hydrate="?(?<idb>[a-zA-Z0-9]+)"?))?\s*>(?<script>[\s\S]+)<\/script>/,
        (_, ida, idb, script) => {
          /** @type {string} */
          const hydrationTarget = ida || idb;
          /** @type {string} */
          const content = script;
          /** @type {string} */
          const hash = Buffer.from(hashString(content), 'base64').toString('hex');
          const filename = struct.options.out.externalizedScriptsPrefix + hash + '.js';
          const absoluteFullPathFileName = path.join(struct.assetsPath.absolute, filename);
          const webFullPathFileName = path.join(path.sep, filename);
          promises.push(createFile(absoluteFullPathFileName, content));
          let value = `<script type="module" data-sveltekit-hydrate="${hydrationTarget}" data-osabe src="${webFullPathFileName}"></script>`;
          if (!hydrationTarget)
          value = `<script data-osabe src="${webFullPathFileName}"></script>`;
          return value;
        }
      );
    }
  )
  return Promise.all(promises).then(() => replaceValue);
}

export default async function externalizeScripts(
  /** @type {import('..').Struct} */ struct,
  ) {
  const htmlFileList = await getHTMLFiles(struct.pagesPath.absolute);
  const promises = htmlFileList.map(async (filePath) => {
    const fh = await open(filePath, 'r+');
    const content = await fh.readFile('utf-8');
    const newHTML = await externalizeScript(content, struct);
    await fh.truncate(0);
    await fh.write(newHTML, 0, 'utf-8');
    await fh.close();
  })
  return await Promise.all(promises)
}
