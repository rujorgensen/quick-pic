import { describe, expect, test } from 'bun:test';
import { ImageCache } from '../src/_helpers/image-cache';

const blobOf = (bytes: number): Blob => new Blob([new Uint8Array(bytes)]);

describe('ImageCache', () => {
    test('returns undefined for an unknown url', () => {
        const cache = new ImageCache(1000);

        expect(cache.checkCache('https://example.com/a')).toBeUndefined();
    });

    test('stores and retrieves a blob', () => {
        const cache = new ImageCache(1000);
        const blob = blobOf(100);

        cache.updateCache('https://example.com/a', blob);

        expect(cache.checkCache('https://example.com/a')).toBe(blob);
    });

    test('skips caching a blob larger than the size limit', () => {
        const cache = new ImageCache(50);

        cache.updateCache('https://example.com/big', blobOf(100));

        expect(cache.checkCache('https://example.com/big')).toBeUndefined();
    });

    test('evicts existing entries to make room for a new blob', () => {
        const cache = new ImageCache(150);

        cache.updateCache('https://example.com/a', blobOf(100));
        expect(cache.checkCache('https://example.com/a')).toBeDefined();

        // Adding a second 100-byte blob exceeds the 150-byte limit, forcing eviction.
        cache.updateCache('https://example.com/b', blobOf(100));

        expect(cache.checkCache('https://example.com/b')).toBeDefined();
        expect(cache.checkCache('https://example.com/a')).toBeUndefined();
    });
});
