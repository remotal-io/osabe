export default function checkPrerenderedPaths(
  /** @type {import('..').Builder["prerendered"]} */ prerendered,
  /** @type {import('..').Builder["log"]} */ logger,
  /** @type {import('..').AdapterOptions["in"]["webAccessibleResources"]} */ warFolderName,
  /** @type {string} */ name,
) {

  const usefulPathsMatcher = [
    /^\/options_ui(\/|\/index.html)?/,
    /^\/action(\/|\/index.html)?/,
    /^\/sidebar_action(\/|\/index.html)?/,
    /^\/web_accessible_resources(\/)?/,
  ];

  const uselessPaths = prerendered.paths
    .map(path => usefulPathsMatcher.map(rgxp => path.match(rgxp)).find(Boolean) ? true : path)
    .filter(item => typeof(item) === 'string')

  const countUselessPaths = uselessPaths.length;
  if (countUselessPaths > 0) {
    const singlePath = countUselessPaths < 2;
    logger.warn(
      `${name}: The following path${singlePath ? '' : 's'} ${singlePath ? 'is' : 'are'} prerendered, but ${singlePath ? 'it'  : 'they'} will not be referenced in the manifest.json.
  If you don't need ${singlePath ? 'it' : 'them'}, remove the matching \`+page.svelte\` to reduce your extension's size.
  If external websites need to load ${singlePath ? 'this' : 'these'} path${singlePath ? '' : 's'} as iframe(s), move ${singlePath ? 'it' : 'them'} to \`routes/${warFolderName}\`:
  `+ uselessPaths.map(path => `  - ${path}`).join('\n')
    );
  }
  
}