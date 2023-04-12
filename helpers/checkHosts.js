/**
 * @typedef {{
 *   name: string;
 *   test: () => boolean;
 * }}
 * Host */

/** @type {Host[]} */
export const hostChecker = [
	{
		name: 'Vercel',
		test: () => !!process.env.VERCEL,
	}
];
