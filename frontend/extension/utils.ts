/* eslint-disable @typescript-eslint/no-misused-spread */
export function base64Decode(content?: string): string {
  if (content === undefined || content === '' || content === 'undefined') return 'undefined';

  const binary = atob(content);
  const bytes = new Uint8Array([...binary].map(char => char.charCodeAt(0)));
  const json = new TextDecoder().decode(bytes); // UTF-8 decode

  return json;
}

export function base64Encode(content?: string): string {
  if (content === undefined || content === '' || content === 'undefined') return 'undefined';

  const bytes = new TextEncoder().encode(content); // UTF-8 encode
  const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');

  return btoa(binary);
}
