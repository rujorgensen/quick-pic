
export const requestImageBlob = async (
    url: URL,
) => {

    const response = await fetch(url, {
        method: 'GET',
    });

    return response.blob();
}
