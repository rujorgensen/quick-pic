import { ISize } from './_interfaces/size.interfaces';
import { compressImage } from './_helpers/compress-image';
import { ImageCache } from './_helpers/image-cache';
import { requestImageBlob } from './_helpers/request-image';

const CACHE_SIZE_LIMIT = 1024 * 1024 * 100; // 100 MB
const imageCache: ImageCache = new ImageCache(CACHE_SIZE_LIMIT);
const acceptedParams: ReadonlyArray<string> = ['url', 'percent', 'size_inside'];

interface IParams {
    requestedURL: URL;
    ratioPercent: number;

    // Uses "inside" of Sharp's resize options
    size?: ISize;
}

Bun.serve({
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        if (path === '/') {
            const fullURL = url.href;

            try {
                const params: IParams = parseAndValidateParams(url.searchParams);

                console.log(params);

                const cachedImage: Blob | undefined = imageCache.checkCache(fullURL);
                if (cachedImage) {
                    console.log(`Read ${cachedImage.size} bytes from cache`);

                    return new Response(cachedImage);
                }

                // Fetch and compress the image
                const requestedImageOriginalginalImage: Blob = await requestImageBlob(params.requestedURL);
                const compressedImage = await compressImage(requestedImageOriginalginalImage, params.ratioPercent, params.size);

                if (compressedImage) {
                    imageCache.updateCache(fullURL, compressedImage);

                    return new Response(compressedImage);
                }

            } catch (error: unknown) {
                return new Response((error && (typeof error === 'object') && ('message' in error)) ? error.message + '' : undefined, { status: 400 });
            }
        };

        // 404s
        return new Response('Page not found', { status: 404 });
    }
})


const parseAndValidateParams = (
    searchParams: URLSearchParams
): IParams => {
    const params: string[] = Array.from(searchParams.keys());

    const invalidParams: string[] = params.filter((param: string) => !acceptedParams.includes(param));

    if(invalidParams.length > 0){
        throw new Error(`Found invalid params: "${invalidParams}". Accepted params are: "${acceptedParams}".`);
    }

    const requestedURLString: string | null = searchParams.get('url');

    if (requestedURLString === null) {
        throw new Error('Please provide a "url" parameter');
    }

    const ratioPercentString: string | null = searchParams.get('percent');

    const ratioPercent: number = ratioPercentString === null ? 100 : Number.parseInt(ratioPercentString, 10);
    if (ratioPercent < 0 || ratioPercent > 100) {
        throw new Error('Please provide a "prc" parameter between 0 and 100');
    }

    const requestedURL: URL = new URL(requestedURLString);

    return {
        requestedURL: requestedURL,
        ratioPercent: ratioPercent,
        size: parseAndValidateOptionalInsideParams(searchParams),
    };
}

/**
 *  size_inside=200x400 (width / height)
 */
const parseAndValidateOptionalInsideParams = (
    searchParams: URLSearchParams
): ISize | undefined => {
    const requestedInsideString: string | null = searchParams.get('size_inside');

    if (requestedInsideString === null) {
        return;
    }

    const [width, height] = requestedInsideString.split('x').map(Number);

    if (isNaN(width) || isNaN(height)) {
        throw new Error('Invalid dimensions format. Please provide a "size_inside" parameter in the format "200x400" (width x height)');
    }

    return {
        width,
        height,
    };
}
