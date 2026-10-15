load('config.js');

function execute(url) {
    var response = fetch(normalizeUrl(url), {
        headers: {
            "Referer": BASE_URL + "/"
        }
    });
    if (!response.ok) return Response.error(CF_MESSAGE);

    var doc = response.html();
    if (isCloudflare(doc)) return Response.error(CF_MESSAGE);

    var images = [];
    doc.select("img.creader-img").forEach(function (e) {
        images.push(e.attr("src"));
    });
    if (images.length === 0) return Response.error("Không đọc được ảnh chương");
    return Response.success(images);
}
