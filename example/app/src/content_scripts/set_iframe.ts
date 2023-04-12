// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore env contains variables from both .env and process.env
// env vars should either be prefixed by VITE_ or config.kit.env.publicPrefix (https://kit.svelte.dev/docs/configuration#env)
import { PUBLIC_HOMEPAGE } from 'env';

// This is an example, of how to identify which platform this code has been built for
// For reference:
// OSABEPLATFORM has the same value as platform in svelte.config.js
//   ...
//   adapter: adapter({
//     manifestBuilder: (manifest, platform) => {
//   ...
// its value is defined at build time, not based on the browser it is running in
//
const isChrome = OSABEPLATFORM === 'chrome';
const isMozilla = OSABEPLATFORM === 'mozilla';
console.log({ isChrome, isMozilla });

const homePage = PUBLIC_HOMEPAGE;
const iframeDataIdentifier = 'osabe.ExAppEx';

// TODO
function findIFrame() {
  return document.querySelector('iframe[data="'+iframeDataIdentifier+'"]') as HTMLIFrameElement | null;
}
function createIFrame(src: string) {
  const newIframe = document.createElement('iframe');
  newIframe.setAttribute('src', src);
  newIframe.setAttribute('data', iframeDataIdentifier);
  newIframe.setAttribute('title', 'Linked2Sheets');
  newIframe.setAttribute('frameborder', '0');

  newIframe.style.width = '100%';
  newIframe.style.height = '480px';
  newIframe.style.paddingTop = '55px';
  document.body.prepend(newIframe);

  return newIframe;
}


const iframe = findIFrame();
if (!iframe) {
  createIFrame(homePage);
} else {
  iframe.setAttribute('src', iframe.getAttribute('src') || homePage)
}
