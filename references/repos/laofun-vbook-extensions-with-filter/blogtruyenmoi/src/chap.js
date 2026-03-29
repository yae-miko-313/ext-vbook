load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        var imgs = [];
        doc.select("#content > img").forEach(e => {
            let url = e.attr("src");
            if (url.indexOf("donate.png") === -1 && url.indexOf("creblogtruyen.jpg") === -1 && url.indexOf("creblm.jpg") === -1 && url.indexOf("blogtruyenmoi.png") === -1) {
                imgs.push(url);
            }
        });
        return Response.success(imgs);
    }
    return null;
}
/**
 * Fetches images from a specified URL after transforming it to a base URL.
 * Filters out specific unwanted images by their filenames.
 *
 * @param {string} originalUrl - The original URL to fetch images from.
 * @return {Array<string> | null} - An array of image URLs or null if the fetch fails.
 */
function fetchImages(originalUrl) {
    const transformedUrl = transformUrlToBase(originalUrl);
    const response = fetchResource(transformedUrl);

    if (response && response.ok) {
        return extractImageUrls(response.html());
    }

    return null;
}

/**
 * Transforms a given URL to a base URL format.
 *
 * @param {string} url - The URL to transform.
 * @return {string} - The transformed URL.
 */
function transformUrlToBase(url) {
    const regexPattern = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img;
    return url.replace(regexPattern, BASE_URL);
}

/**
 * Fetches resource from the given URL.
 *
 * @param {string} url - The URL to fetch from.
 * @return {Response} - The fetch response.
 */
function fetchResource(url) {
    return fetch(url);
}

/**
 * Extracts image URLs from the HTML document, excluding specific filenames.
 *
 * @param {Document} doc - The HTML document to extract images from.
 * @return {Array<string>} - An array of image URLs.
 */
function extractImageUrls(doc) {
    const excludedFilenames = ['donate.png', 'creblogtruyen.jpg', 'creblm.jpg', 'blogtruyenmoi.png'];
    const imageUrls = [];

    doc.select("#content > img").forEach(element => {
        const imageUrl = element.attr("src");
        if (!excludedFilenames.some(excludedFile => imageUrl.includes(excludedFile))) {
            imageUrls.push(imageUrl);
        }
    });

    return imageUrls;
}
