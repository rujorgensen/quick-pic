import { describe, expect, test } from 'bun:test';
import { compressImage } from '../src/_helpers/compress-image';

const fixture = (name: string): Blob =>
    new Blob([Bun.file(`${import.meta.dir}/fixtures/${name}`)]);

const formats = [
    { name: 'jpeg', file: 'sample.jpeg', mime: 'image/jpeg' },
    { name: 'png', file: 'sample.png', mime: 'image/png' },
    { name: 'webp', file: 'sample.webp', mime: 'image/webp' },
] as const;

const metadata = async (blob: Blob) =>
    new Bun.Image(await blob.arrayBuffer()).metadata();

describe('compressImage', () => {
    for (const { name, file, mime } of formats) {
        describe(name, () => {
            test('returns a same-format blob with the correct MIME type', async () => {
                const out = await compressImage(fixture(file), 80);

                expect(out).toBeInstanceOf(Blob);
                expect(out.size).toBeGreaterThan(0);
                expect(out.type).toBe(mime);
                expect((await metadata(out)).format).toBe(name);
            });

            test('preserves dimensions when no size is given', async () => {
                const out = await compressImage(fixture(file), 80);
                const meta = await metadata(out);

                expect(meta.width).toBe(48);
                expect(meta.height).toBe(48);
            });

            test('resizes within the "inside" bounds while keeping the format', async () => {
                const out = await compressImage(fixture(file), 80, { width: 24, height: 24 });
                const meta = await metadata(out);

                expect(meta.width).toBeLessThanOrEqual(24);
                expect(meta.height).toBeLessThanOrEqual(24);
                expect(meta.format).toBe(name);
            });
        });
    }

    test('lower quality yields a smaller jpeg than higher quality', async () => {
        const high = await compressImage(fixture('sample.jpeg'), 90);
        const low = await compressImage(fixture('sample.jpeg'), 10);

        expect(low.size).toBeLessThan(high.size);
    });

    test('throws on undecodable input', async () => {
        const garbage = new Blob([new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])]);

        expect(compressImage(garbage, 80)).rejects.toThrow();
    });
});
