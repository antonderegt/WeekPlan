export function createId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return (
      `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-` +
      `${hex[4]}${hex[5]}-` +
      `${hex[6]}${hex[7]}-` +
      `${hex[8]}${hex[9]}-` +
      `${hex.slice(10).join('')}`
    );
  }

  let d = Date.now();
  let d2 = 0;
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d2 = performance.now() * 1000;
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16;
      d2 = Math.floor(d2 / 16);
    }
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return Math.floor(v).toString(16);
  });
}
