/**
 * @param {*} x
 * @param {*} y
 * @returns {boolean}
 */
export function eq(x: any, y: any): boolean;
/**
 * @param {string} packageName
 * @param {string[]} qualifiers
 */
export function beginUnit(packageName: string, ...qualifiers: string[]): void;
/**
 * @returns {string[]?}
 */
export function currentUnit(): string[] | null;
/**
 * @param {string} packageName
 * @param {string[]} qualifiers
 */
export function endUnit(packageName: string, ...qualifiers: string[]): void;
/**
 * @param {string?} descr
 * @param {() => void} tc
 */
export function test(descr: string | null, tc: () => void): void;
/**
 * @param {boolean} value
 * @param {string=} descr
 */
export function assert(value: boolean, descr?: string | undefined): void;
/**
 * @param {boolean} value
 * @param {string=} descr
 */
export function assertTrue(value: boolean, descr?: string | undefined): void;
/**
 * @param {boolean} value
 * @param {string=} descr
 */
export function assertFalse(value: boolean, descr?: string | undefined): void;
/**
 * @param {*} value1
 * @param {*} value2
 * @param {string=} descr
 */
export function assertEq(value1: any, value2: any, descr?: string | undefined): void;
/**
 * @param {*} value1
 * @param {*} value2
 * @param {string=} descr
 */
export function assertNEq(value1: any, value2: any, descr?: string | undefined): void;
/**
 * @param {() => *} lazyValue
 * @param {string=} descr
 */
export function assertThrow(lazyValue: () => any, descr?: string | undefined): void;
/**
 * @param {() => *} lazyValue
 * @param {string=} descr
 */
export function assertLazy(lazyValue: () => any, descr?: string | undefined): void;
/**
 * @param {string | string[] | ((unit: string[]) => boolean)} unitFilter
 * @param {(s : string) => void} log
 */
export function runTests(unitFilter: string | string[] | ((unit: string[]) => boolean), log: (s: string) => void): Promise<boolean>;
/** @param {*} obj */
export function lockClass(obj: any): void;
/** @param {*} obj */
export function lockFunc(obj: any): void;
export function lockdown(): void;
//# sourceMappingURL=index.d.mts.map