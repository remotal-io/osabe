import { sep } from 'path';

export default function checkAssetsFolderName(
  /** @type {import('..').Builder["log"]} */ logger,
  /** @type {string} */ name,
  /** @type {string} */ defaultName
) {
  if (name.includes(sep)) {
    logger.error(
      `${name}: \`assetsFolderName\` can not be a path.
Remove any "${sep}" from \`assetsFolderName\`.
Default value is "${defaultName}"`
    );
  }
  return name;
}
