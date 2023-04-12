import path from 'path';
import { open, unlink } from 'fs/promises'

const replacePlaceholderExpressionAndMoveSW = async function replacePlaceholderExpressionAndMove(
  /** @type {import('..').Struct} */ struct,
  ) {
  if (!struct.options.platformPlaceholder.replace) return;
  const prerenderedSWFilePath = path.join(struct.assetsPath.absolute, struct.serviceWorkerFileName);
  const targetSWFilePath = path.join(struct.pagesPath.absolute, struct.serviceWorkerFileName);
  const stringifiedPlatform = JSON.stringify(struct.platform);
  const fh = await open(prerenderedSWFilePath, 'r+');
  const content = await fh.readFile('utf-8');
  const result = content.replaceAll(struct.options.platformPlaceholder.expression, stringifiedPlatform);
  await fh.truncate(0);
  await fh.write(result, 0, 'utf-8');
  await fh.close();
  if (prerenderedSWFilePath !== targetSWFilePath) {
    struct.builder.copy(prerenderedSWFilePath, targetSWFilePath);
    await unlink(prerenderedSWFilePath);
  }
  return;
}

export default replacePlaceholderExpressionAndMoveSW;