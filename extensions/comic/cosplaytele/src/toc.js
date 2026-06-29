load('config.js');

function execute(url) {
    if (!url) return Response.error("No url");
    url = url.replace(BASE_URL, '');
    if (!url.startsWith('/')) url = '/' + url;
    url = url.replace(/\/$/, '');

    return Response.success([
        { name: 'Gallery', url: url, host: BASE_URL }
    ]);
}
