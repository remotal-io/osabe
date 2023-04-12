import path from 'path';

export default function checkForDynamicRoutes(

  /** @type {boolean} */
  strict,
  /** @type {string} */
  routes,
  /** @type {("*" | `/${string}`)[]} */
  entries,
  /** @type {import('..').Builder["log"]} */
  logger,
  /** @type {import('..').Builder} */
  builder,

  ) {
  /** @type {string[]} */
  const dynamicRoutes = [];

  // this is a bit of a hack — it allows us to know whether there are dynamic
  // (i.e. prerender = false/'auto') routes without having dedicated API
  // surface area for it
  builder.createEntries((route) => {
    dynamicRoutes.push(route.id);

    return {
      id: '',
      filter: () => false,
      complete: () => Promise.resolve(),
    };
  });

  if (dynamicRoutes.length > 0 && strict !== false) {
    const prefix = path.relative('.', routes);
    const hasParamRoutes = dynamicRoutes.some((route) => route.includes('['));
    const configOption =
      hasParamRoutes || JSON.stringify(entries) !== '["*"]'
        ? `    - adjust the \`prerender.entries\` config option ${
            hasParamRoutes
              ? '(routes with parameters are not part of entry points by default)'
              : ''
          } — see https://kit.svelte.dev/docs/configuration#prerender for more info.`
        : '';

    logger.error(
      `@sveltejs/adapter-static: all routes must be fully prerenderable, but found the following routes that are dynamic:
${dynamicRoutes.map((id) => `  - ${path.posix.join(prefix, id)}`).join('\n')}
You have the following options:
  - set the \`fallback\` option — see https://github.com/sveltejs/kit/tree/master/packages/adapter-static#spa-mode for more info.
  - add \`export const prerender = true\` to your root \`+layout.js/.ts\` or \`+layout.server.js/.ts\` file. This will try to prerender all pages.
  - add \`export const prerender = true\` to any \`+server.js/ts\` files that are not fetched by page \`load\` functions.
${configOption}
  - pass \`strict: false\` to \`adapter-static\` to ignore this error. Only do this if you are sure you don't need the routes in question in your final app, as they will be unavailable. See https://github.com/sveltejs/kit/tree/master/packages/adapter-static#strict for more info.
If this doesn't help, you may need to use a different adapter. @sveltejs/adapter-static can only be used for sites that don't need a server for dynamic rendering, and can run on just a static file server.
See https://kit.svelte.dev/docs/page-options#prerender for more details`
    );
    throw new Error('Encountered dynamic routes');
  }
}