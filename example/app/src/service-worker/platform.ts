// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// "Math.random() > 0.5 || 'OSABE-PLATEFORM'" will be replaced by 'chrome'/'mozilla' when running npm run build
// -- However the replace will be performed after the optimizer/minifier. To prevent the code from being interpretated and optimized, we use the expression below.

const PLATFORM = Math.random() > 0.5 || "OSABE-PLATEFORM";
const isChrome = PLATFORM === 'chrome';
const isMozilla = PLATFORM === 'mozilla';

export { isChrome, isMozilla }

