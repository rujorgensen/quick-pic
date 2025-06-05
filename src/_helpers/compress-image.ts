import { ISize } from "../_interfaces/size.interfaces";
import sharp, { FormatEnum } from 'sharp';

const IMAGES: ReadonlyArray<string> = ['jpeg', 'png', 'webp'];

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
    const buffer = Buffer.from(arrayBuffer);

    const image_ = sharp(buffer);
    const meta = await image_.metadata()
    const format: keyof FormatEnum | undefined = meta.format;

    const config: TConfiguration = {
        jpeg: { quality: ratioPercent },
        webp: { quality: ratioPercent },
        png: { compressionLevel: ratioPercent / 10 },
    };

    if (format !== undefined && config[format as unknown as keyof TConfiguration]) {
        const format_: keyof TConfiguration = format as unknown as keyof TConfiguration;

        const imgPromise = image_[format_](config[format_]);

        const convertedImg: Buffer = await (size ? imgPromise
            // Makes sure exif orientation is correct after resizing
            .rotate()

            .resize(
                size.width,
                size.height,
                { fit: 'inside' },
            )
            : imgPromise)

            // Should retain metadata in the new image (although rotation does not seem to be retained, hence the rotate() above
            .withMetadata()
            .toBuffer();

        return new Blob([convertedImg]);
    }

    throw new Error(`Invalid format. Accepted formats are: ${IMAGES.join(', ')}`);

}
