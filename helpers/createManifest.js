import { writeFile } from 'fs/promises'
import { constants } from 'fs'
import path from 'path';

export default function createManifest(
  /** @type {string} */ manifestContent,
  /** @type {string} */ pages,
  /** @type {string} */ manifestFilename,
) {
  const filePath = '.' + path.sep + path.join(pages, manifestFilename);
  return writeFile(filePath, manifestContent, {
    encoding: 'utf8',
    flag: constants.O_CREAT | constants.O_TRUNC | constants.O_WRONLY,
  })
  .catch(e => {
    throw new Error(`Failed trying to write ${filePath}\n${e.message}`)
  })
}
