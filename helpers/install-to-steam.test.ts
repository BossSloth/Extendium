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
      a: true,
    };
    const second = {
      a: true,
      z: { value: '<all_urls>', empty: {} },
    };

    expect(stringifyForHmac(first)).toBe(
      '{"a":true,"z":{"value":"\\u003Call_urls>"}}',
    );
    expect(stringifyForHmac(second)).toBe(stringifyForHmac(first));
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
