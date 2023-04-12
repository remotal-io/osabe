import constants from 'constants';
import { readdir, access } from 'fs/promises'

export default async function listFolder(
  /** @type {string} */ dirName,
  /** @type {boolean} */ recursive = true,
) {

  try {
    await access(dirName, constants.R_OK);
  } catch (e) {
    return []
  }

  /** @type {string[]} */
  const files = [];
  const items = await readdir(dirName, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      if (recursive) {
        files.push(...(await listFolder(`${dirName}/${item.name}`)));
      }
    } else {
      files.push(`${dirName}/${item.name}`);
    }
  }
  return files;
}