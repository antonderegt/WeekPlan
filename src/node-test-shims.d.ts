declare module 'node:assert/strict' {
  const assert: any;
  export default assert;
}

declare module 'node:test' {
  export const afterEach: any;
  export const describe: any;
  export const it: any;
  export const mock: any;
}
