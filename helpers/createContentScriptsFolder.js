import { mkdir, access, unlink } from 'fs/promises'
import { constants } from 'fs'
import listFolder from './listFolder.js';

export default async function createContentScriptsFolder(
	/** @type {import('..').Struct} */ struct,
) {
  const folderPath = struct.contentScriptPath.absolute;
  const exists = await access(folderPath, constants.R_OK)
    .then( () => true )
    .catch( () => false )

  if (exists) {
    await listFolder(folderPath)
      .then(files => Promise.all(files.map(filePath => unlink(filePath))));
  } else {
    await mkdir(folderPath, {
      recursive: false,
      mode: 0o744
    });
  }
}