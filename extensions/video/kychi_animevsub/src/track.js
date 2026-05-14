load('config.js');

function execute(input) {
    var data = {};
    try {
        data = JSON.parse(input);
    } catch (e) {
        // Fallback for direct link
        data = { url: input };
    }

    var streamUrl = data.url;
    var referer = data.referer || DEFAULT_REFERER;

    return Response.success({
        data: streamUrl,
        type: 'native',
        headers: {
            'Referer': referer,
            'User-Agent': BASE_UA
        }
    });
}

