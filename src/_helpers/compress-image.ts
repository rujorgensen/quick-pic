import { ISize } from "../_interfaces/size.interfaces";

const IMAGES: ReadonlyArray<string> = ['jpeg', 'png', 'webp'];

type TImageFormat = 'jpeg' | 'png' | 'webp';

type TConfiguration = {
    jpeg: { quality: number };
    webp: { quality: number };
    png: { compressionLevel: number };
}

/**
 * Compresses an image to a specified quality ratio and optionally resizes it.
 * 
 * @throws { Error} - If the image format is not supported.
 *
 * @param { Blob } image - The image to compress.
 * @param { number } ratioPercent - The quality ratio for compression (0-100).
 * @param { ISize } [size] - Optional size to resize the image to.
 * 
 * @returns { Promise<Blob> } - A promise that resolves to the compressed image as a Blob.
 */
export const compressImage = async (
    image: Blob,
    ratioPercent: number, // 0 - 100
    size?: ISize,
): Promise<Blob> => {
    const arrayBuffer = await image.arrayBuffer();

    const meta = await new Bun.Image(arrayBuffer).metadata();
    // Bun.Image sniffs format from bytes; meta.format is always defined on success
    // (unknown/undecodable inputs reject the promise before reaching here)
    const format: TImageFormat | undefined = IMAGES.includes(meta.format) ? meta.format as TImageFormat : undefined;

    const config: TConfiguration = {
        jpeg: { quality: ratioPercent },
        webp: { quality: ratioPercent },
        png: { compressionLevel: ratioPercent / 10 },
    };

    if (format !== undefined) {
        // Bun.Image applies EXIF orientation automatically before any transform
        // (autoOrient: true by default), so no explicit .rotate() is needed
        const img = new Bun.Image(arrayBuffer);
        const pipeline = size ? img.resize(size.width, size.height, { fit: 'inside' }) : img;

        switch (format) {
            case 'jpeg': return pipeline.jpeg(config.jpeg).blob();
            case 'png': return pipeline.png(config.png).blob();
            case 'webp': return pipeline.webp(config.webp).blob();
        }
    }

    throw new Error(`Invalid format. Accepted formats are: ${IMAGES.join(', ')}`);
};
