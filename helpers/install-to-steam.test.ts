import { describe, expect, test } from 'bun:test';

import {
  computeMac,
  computeSuperMac,
  stringifyForHmac,
} from './install-to-steam';

const DEVICE_ID = '00000000-0000-0000-0000-000000000000';
const EMPTY_SEED = Buffer.alloc(0);

describe('Chromium tracked-preference HMACs', () => {
  test('matches the macOS developer-mode golden vector', () => {
    expect(
      computeMac(
        EMPTY_SEED,
        DEVICE_ID,
        'extensions.ui.developer_mode',
        true,
      ),
    ).toBe('2B2D34E187226094146FC0EB125FAF64089DDCA8911747FB65602EAF965672A9');
  });

  test('sorts keys, escapes less-than signs, and removes empty children', () => {
    const first = {
      z: { empty: {}, value: '<all_urls>' },
      path: '/Users/test/extension',
      a: true,
    };
    const second = {
      a: true,
      path: '/Users/test/extension',
      z: { value: '<all_urls>', empty: {} },
    };

    expect(stringifyForHmac(first)).toBe(
      '{"a":true,"path":"/Users/test/extension","z":{"value":"\\u003Call_urls>"}}',
    );
    expect(stringifyForHmac(second)).toBe(stringifyForHmac(first));
  });

  test('matches Chromium when URL and path values contain forward slashes', () => {
    const value = {
      matches: ['https://store.steampowered.com/'],
      path: '/Users/test/extension',
    };

    expect(stringifyForHmac(value)).toBe(
      '{"matches":["https://store.steampowered.com/"],"path":"/Users/test/extension"}',
    );
    expect(
      computeMac(
        EMPTY_SEED,
        DEVICE_ID,
        'extensions.settings.test',
        value,
      ),
    ).toBe('52104A704C3604F6D23DFDFCD8A9F7997B39911771793ABC792E00E92D663BA9');
  });

  test('matches a canonical super-MAC golden vector', () => {
    expect(
      computeSuperMac(EMPTY_SEED, DEVICE_ID, {
        z: { value: 'two' },
        empty: {},
        a: { value: 'one' },
      }),
    ).toBe('F95D60E865DD3E8619F51900DA0831D498E5B2A19F67F0129B5D80275EA981D2');
  });
});
