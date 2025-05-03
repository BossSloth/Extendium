export function base64Decode(content: string): string {
  return window.atob(content);
}

export function base64Encode(content: string): string {
  return window.btoa(content);
}
