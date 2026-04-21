load('config.js');

function isImage(url) {
    if (!url) return false;
    return /\.(jpe?g|png|webp|gif)(?:\?|$)/i.test(url);
}

function execute(url) {
    if (!url) return Response.error("No url");

    url = url.replace(BASE_URL, '');
    if (!url.startsWith('/')) url = '/' + url;
    url = url.replace(/\/$/, '');

    var response = fetch(BASE_URL + url, { method: 'GET' });
    if (!response.ok) return Response.error("Failed to load chapter");

    var doc = response.html();
    var data = [];

    // Primary: images within WP gallery
    doc.select('#gallery-1 .gallery-item img').forEach(function(img){
        var src = img.attr('src') || img.attr('data-src') || img.attr('data-original');
        if (isImage(src)) data.push(src);
    });

    // Fallback: any image inside entry-content links
    if (data.length === 0) {
        doc.select('.entry-content a img').forEach(function(img){
            var src = img.attr('src') || img.attr('data-src') || img.attr('data-original');
            if (isImage(src)) data.push(src);
        });
    }

    if (data.length > 0) return Response.success(data);
    return Response.error("No images found");
}
