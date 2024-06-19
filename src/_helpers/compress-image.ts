import { ISize } from "../_interfaces/size.interfaces";
import sharp, { FormatEnum } from 'sharp';

const IMAGES: ReadonlyArray<string> = ['jpeg', 'png', 'webp'];

type TConfiguration = {
    jpeg: { quality: number };
    webp: { quality: number };
    png: { compressionLevel: number };
}

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
            .resize(
                size.width,
                size.height,
                { fit: 'inside' })
            : imgPromise)
            .toBuffer();

        return new Blob([convertedImg]);
    }

    throw new Error(`Invalid format. Accepted formats are: ${IMAGES.join(', ')}`);

}
