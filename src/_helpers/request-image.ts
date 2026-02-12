/**
 * Request an image from a URL and return it as a Blob.
 */
export const requestImageBlob = async (
    url: URL,
): Promise<Blob> => {

    const response = await fetch(url, {
        method: 'GET',
    });

    return response.blob();
}
