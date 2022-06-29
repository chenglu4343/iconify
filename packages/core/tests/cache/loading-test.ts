import type { IconifyJSON } from '@iconify/types';
import type { BrowserStorageItem } from '../../lib/browser-storage/types';
import { initBrowserStorage } from '../../lib/browser-storage';
import {
	browserStorageConfig,
	browserStorageEmptyItems,
} from '../../lib/browser-storage/data';
import { getBrowserStorageItemsCount } from '../../lib/browser-storage/count';
import { getBrowserStorage } from '../../lib/browser-storage/global';
import { getStorage, iconExists } from '../../lib/storage/storage';
import { nextPrefix, createCache, reset } from '../../lib/browser-storage/mock';
import {
	browserCacheCountKey,
	browserCachePrefix,
	browserCacheVersion,
	browserCacheVersionKey,
	browserStorageHour,
	browserStorageCacheExpiration,
} from '../../lib/browser-storage/config';

describe('Testing loading from localStorage', () => {
	const provider = '';

	it('Valid icon set', () => {
		const prefix = nextPrefix();
		const cache = createCache();

		// Add one icon set
		cache.setItem(browserCacheVersionKey, browserCacheVersion);
		cache.setItem(browserCacheCountKey, '1');

		const item: BrowserStorageItem = {
			cached: Math.floor(Date.now() / browserStorageHour),
			provider,
			data: {
				prefix: prefix,
				icons: {
					foo: {
						body: '<g></g>',
					},
				},
			},
		};
		cache.setItem(browserCachePrefix + '0', JSON.stringify(item));

		// Set cache
		reset({
			localStorage: cache,
		});

		// Only locaStorage should be available
		expect(getBrowserStorage('local')).toBeDefined();
		expect(getBrowserStorage('session')).toBeUndefined();

		// 1 icon
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			1
		);

		// Check icon storage
		const icons = getStorage(provider, prefix);
		expect(iconExists(icons, 'foo')).toBe(false);

		// Load localStorage
		initBrowserStorage();

		// Icon should exist now
		expect(iconExists(icons, 'foo')).toBe(true);

		// Check data
		expect(browserStorageConfig).toEqual({
			local: true,
			session: false,
		});
		expect(browserStorageEmptyItems).toEqual({
			local: new Set(),
			session: new Set(),
		});
	});

	it('Different provider', () => {
		const provider = nextPrefix();
		const prefix = nextPrefix();
		const cache = createCache();

		// Add one icon set
		cache.setItem(browserCacheVersionKey, browserCacheVersion);
		cache.setItem(browserCacheCountKey, '1');

		const item: BrowserStorageItem = {
			cached: Math.floor(Date.now() / browserStorageHour),
			provider,
			data: {
				prefix: prefix,
				icons: {
					foo: {
						body: '<g></g>',
					},
				},
			},
		};
		cache.setItem(browserCachePrefix + '0', JSON.stringify(item));

		// Set cache
		reset({
			localStorage: cache,
		});

		// Check icon storage
		const icons = getStorage(provider, prefix);
		expect(iconExists(icons, 'foo')).toBe(false);

		// Check default provider
		const icons2 = getStorage('', prefix);
		expect(iconExists(icons2, 'foo')).toBe(false);

		// Load localStorage
		initBrowserStorage();

		// Icon should exist now
		expect(iconExists(icons, 'foo')).toBe(true);
		expect(iconExists(icons2, 'foo')).toBe(false);

		// Check data
		expect(browserStorageConfig).toEqual({
			local: true,
			session: false,
		});
		expect(browserStorageEmptyItems).toEqual({
			local: new Set(),
			session: new Set(),
		});
	});

	it('Expired icon set', () => {
		const prefix = nextPrefix();
		const cache = createCache();

		// Add one icon set
		cache.setItem(browserCacheVersionKey, browserCacheVersion);
		cache.setItem(browserCacheCountKey, '1');

		const item: BrowserStorageItem = {
			// Expiration date
			cached:
				Math.floor(Date.now() / browserStorageHour) -
				browserStorageCacheExpiration -
				1,
			provider,
			data: {
				prefix: prefix,
				icons: {
					foo: {
						body: '<g></g>',
					},
				},
			},
		};
		cache.setItem(browserCachePrefix + '0', JSON.stringify(item));

		// Set cache
		reset({
			localStorage: cache,
		});

		// Counter should be 1 before parsing it
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			1
		);

		// Check icon storage
		const icons = getStorage(provider, prefix);
		expect(iconExists(icons, 'foo')).toBe(false);

		// Load localStorage
		initBrowserStorage();

		// Icon should not have loaded
		expect(iconExists(icons, 'foo')).toBe(false);

		// Check data
		expect(browserStorageConfig).toEqual({
			local: true,
			session: false,
		});
		expect(browserStorageEmptyItems).toEqual({
			local: new Set(),
			session: new Set(),
		});

		// Counter should have changed to 0
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			0
		);
	});

	it('Bad icon set', () => {
		const prefix = nextPrefix();
		const cache = createCache();

		// Add one icon set
		cache.setItem(browserCacheVersionKey, browserCacheVersion);
		cache.setItem(browserCacheCountKey, '1');
		cache.setItem(
			browserCachePrefix + '0',
			JSON.stringify({
				cached: Math.floor(Date.now() / browserStorageHour),
				provider,
				data: {
					prefix: prefix,
					icons: {
						foo: {
							// Missing 'body' property
							width: 20,
						},
					},
				},
			})
		);

		// Set cache
		reset({
			localStorage: cache,
		});

		// Counter should be 1 before parsing it
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			1
		);

		// Check icon storage
		const icons = getStorage(provider, prefix);
		expect(iconExists(icons, 'foo')).toBe(false);

		// Load localStorage
		initBrowserStorage();

		// Icon should not have loaded
		expect(iconExists(icons, 'foo')).toBe(false);

		// Check data
		expect(browserStorageConfig).toEqual({
			local: true,
			session: false,
		});
		expect(browserStorageEmptyItems).toEqual({
			local: new Set(),
			session: new Set(),
		});

		// Counter should have changed to 0
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			0
		);
	});

	it('Wrong counter', () => {
		const prefix = nextPrefix();
		const cache = createCache();

		// Add one icon set
		cache.setItem(browserCacheVersionKey, browserCacheVersion);
		cache.setItem(browserCacheCountKey, '0'); // Should be at least "1"

		const item: BrowserStorageItem = {
			cached: Math.floor(Date.now() / browserStorageHour),
			provider,
			data: {
				prefix: prefix,
				icons: {
					foo: {
						body: '<g></g>',
					},
				},
			},
		};
		cache.setItem(browserCachePrefix + '0', JSON.stringify(item));

		// Set cache
		reset({
			localStorage: cache,
		});

		// Counter should be 0
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			0
		);

		// Check icon storage
		const icons = getStorage(provider, prefix);
		expect(iconExists(icons, 'foo')).toBe(false);

		// Load localStorage
		initBrowserStorage();

		// Icon should not have loaded
		expect(iconExists(icons, 'foo')).toBe(false);

		// Check data
		expect(browserStorageConfig).toEqual({
			local: true,
			session: false,
		});
		expect(browserStorageEmptyItems).toEqual({
			local: new Set(),
			session: new Set(),
		});
	});

	it('Missing entries at the end', () => {
		const prefix = nextPrefix();
		const cache = createCache();

		// Add one icon set
		cache.setItem(browserCacheVersionKey, browserCacheVersion);
		cache.setItem(browserCacheCountKey, '5');

		const item: BrowserStorageItem = {
			cached: Math.floor(Date.now() / browserStorageHour),
			provider,
			data: {
				prefix: prefix,
				icons: {
					foo: {
						body: '<g></g>',
					},
				},
			},
		};
		cache.setItem(browserCachePrefix + '0', JSON.stringify(item));

		// Set cache
		reset({
			localStorage: cache,
		});

		// Counter should be 5 before validation
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			5
		);

		// Check icon storage
		const icons = getStorage(provider, prefix);
		expect(iconExists(icons, 'foo')).toBe(false);

		// Load localStorage
		initBrowserStorage();

		// Icon should exist now
		expect(iconExists(icons, 'foo')).toBe(true);

		// Check data
		expect(browserStorageConfig).toEqual({
			local: true,
			session: false,
		});
		expect(browserStorageEmptyItems).toEqual({
			local: new Set(),
			session: new Set(),
		});

		// Counter should be 1 after validation
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			1
		);
	});

	it('Missing entries', () => {
		const prefix = nextPrefix();
		const cache = createCache();

		// Add two icon sets
		cache.setItem(browserCacheVersionKey, browserCacheVersion);
		cache.setItem(browserCacheCountKey, '5');

		// Missing: 0, 2, 3
		const item1: BrowserStorageItem = {
			cached: Math.floor(Date.now() / browserStorageHour),
			provider,
			data: {
				prefix: prefix,
				icons: {
					foo1: {
						body: '<g></g>',
					},
				},
			},
		};
		const item4: BrowserStorageItem = {
			cached: Math.floor(Date.now() / browserStorageHour),
			provider,
			data: {
				prefix: prefix,
				icons: {
					foo4: {
						body: '<g></g>',
					},
				},
			},
		};

		cache.setItem(browserCachePrefix + '1', JSON.stringify(item1));
		cache.setItem(browserCachePrefix + '4', JSON.stringify(item4));

		// Set cache
		reset({
			localStorage: cache,
		});

		// Counter should be 5 before validation
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			5
		);

		// Check icon storage
		const icons = getStorage(provider, prefix);
		expect(iconExists(icons, 'foo1')).toBe(false);
		expect(iconExists(icons, 'foo4')).toBe(false);

		// Load localStorage
		initBrowserStorage();

		// Icons should exist now
		expect(iconExists(icons, 'foo1')).toBe(true);
		expect(iconExists(icons, 'foo4')).toBe(true);

		// Check data
		expect(browserStorageConfig).toEqual({
			local: true,
			session: false,
		});
		expect(browserStorageEmptyItems).toEqual({
			local: new Set([3, 2, 0]), // reserse order
			session: new Set(),
		});

		// Counter should be 5 after validation
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(getBrowserStorageItemsCount(getBrowserStorage('local')!)).toBe(
			5
		);
	});

	it('Using both storage options', () => {
		const prefix = nextPrefix();
		const cache1 = createCache();
		const cache2 = createCache();

		// Add few icon sets
		cache1.setItem(browserCacheVersionKey, browserCacheVersion);
		cache2.setItem(browserCacheVersionKey, browserCacheVersion);

		cache1.setItem(browserCacheCountKey, '6');
		cache2.setItem(browserCacheCountKey, '3');

		// Create 5 items
		const icons: IconifyJSON[] = [];
		const items: BrowserStorageItem[] = [];

		for (let i = 0; i < 6; i++) {
			const icon: IconifyJSON = {
				prefix: prefix,
				icons: {
					['foo' + i.toString()]: {
						body: '<g></g>',
					},
				},
			};
			const item: BrowserStorageItem = {
				cached: Math.floor(Date.now() / browserStorageHour),
				provider,
				data: icon,
			};
			icons.push(icon);
			items.push(item);
		}

		// Add items 1,3,5 to localStorage
		[1, 3, 5].forEach((index) => {
			cache1.setItem(
				browserCachePrefix + index.toString(),
				JSON.stringify(items[index])
			);
		});

		// Add items 0 and 2 to sessionStorage
		[0, 2].forEach((index) => {
			cache2.setItem(
				browserCachePrefix + index.toString(),
				JSON.stringify(items[index])
			);
		});

		// Set cache
		reset({
			localStorage: cache1,
			sessionStorage: cache2,
		});

		// Check icon storage
		const iconsStorage = getStorage(provider, prefix);
		for (let i = 0; i < 6; i++) {
			expect(iconExists(iconsStorage, 'foo' + i.toString())).toBe(false);
		}

		// Load localStorage
		initBrowserStorage();

		// Icons should exist now, except for number 4
		for (let i = 0; i < 6; i++) {
			expect(iconExists(iconsStorage, 'foo' + i.toString())).toBe(
				i !== 4
			);
		}

		// Check data
		expect(browserStorageConfig).toEqual({
			local: true,
			session: true,
		});
		expect(browserStorageEmptyItems).toEqual({
			local: new Set([4, 2, 0]),
			session: new Set([1]),
		});
	});
});
