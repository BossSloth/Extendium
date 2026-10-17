import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { linkClickInterceptor } from '../webkit/linkModifier';

let clickListener: (event: object) => void;
const location = { href: '' };
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');

beforeEach(() => {
  location.href = '';
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      addEventListener: (_event: string, callback: typeof clickListener): void => {
        clickListener = callback;
      },
    },
  });
  Object.defineProperty(globalThis, 'location', { configurable: true, value: location });
});

afterEach(() => {
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
  else Reflect.deleteProperty(globalThis, 'document');
  if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
  else Reflect.deleteProperty(globalThis, 'location');
});

function click(href: string, target = ''): { anchor: { href: string; target: string }; prevented: boolean } {
  const anchor = { href, target };
  const preventDefault = mock(() => undefined);
  clickListener({ target: { closest: () => anchor }, preventDefault });

  return { anchor, prevented: preventDefault.mock.calls.length > 0 };
}

test.each([
  ['', false],
  ['', true],
  ['   ', false],
  ['   ', true],
] as const)('ignores a blank rule (%j, regex=%j)', (match, isRegex) => {
  linkClickInterceptor([{ match, isRegex }], {});
  expect(click('https://store.steampowered.com/app/10/').prevented).toBe(false);
  expect(location.href).toBe('');
});

test('still opens matching nonempty rules externally', () => {
  linkClickInterceptor(
    [
      { match: '', isRegex: false },
      { match: 'example.com', isRegex: false },
    ],
    {},
  );
  const href = 'https://example.com/page';
  expect(click(href).prevented).toBe(true);
  expect(location.href).toBe(`steam://openurl_external/${href}`);
});

test('keeps nonmatching Steam links internal when another rule is configured', () => {
  linkClickInterceptor(
    [
      { match: '', isRegex: false },
      { match: 'example.com', isRegex: false },
    ],
    {},
  );
  expect(click('https://store.steampowered.com/').prevented).toBe(false);
  expect(location.href).toBe('');
});

test('preserves explicit match-all regex patterns', () => {
  linkClickInterceptor([{ match: '/.*/i', isRegex: true }], {});
  expect(click('https://store.steampowered.com/').prevented).toBe(true);
});

test('blank rules do not override opening a link in the current tab', () => {
  linkClickInterceptor([{ match: '', isRegex: false }], { openLinksInCurrentTab: true });
  const result = click('steam://openurl/https://example.com/', '_blank');
  expect(result.prevented).toBe(false);
  expect(result.anchor).toEqual({ href: 'https://example.com/', target: '_self' });
  expect(location.href).toBe('');
});
