import { sep } from 'path';

export default function checkExternalizedScriptsFolderName(
  /** @type {import('..').Builder["log"]} */ logger,
  /** @type {string} */ name,
  /** @type {string} */ defaultName
) {
  if (name.includes(sep)) {
    logger.error(
      `${name}: \`externalizedScriptsFolderName\` can not be a path.
Remove any "${sep}" from \`externalizedScriptsFolderName\`.
Default value is "${defaultName}"`
    );
  }
  return name;
}
