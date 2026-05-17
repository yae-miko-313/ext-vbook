load('config.js');

function execute(url) {
    if (!url) return Response.error('No URL provided');

    return Response.success({
        data: url,
        type: 'auto',
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
        }
    });
}
