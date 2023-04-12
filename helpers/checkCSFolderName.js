import { sep } from 'path';

export default function checkCSFolderName(
  /** @type {import('..').Builder["log"]} */ logger,
  /** @type {string} */ name,
  /** @type {string} */ defaultName
) {
  if (name.includes(sep)) {
    logger.error(
      `${name}: \`checkCSFolderName\` can not be a path.
Remove any "${sep}" from \`checkCSFolderName\`.
Default value is "${defaultName}"`
    );
  }
  return name;
}
