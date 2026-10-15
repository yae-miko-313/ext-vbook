load('config.js');

function execute(url) {
    var response = fetch(normalizeUrl(url), {
        headers: {
            "Referer": BASE_URL + "/"
        }
    });
    if (!response.ok) return Response.error(CF_MESSAGE);

    // The intro page inlines the stream: window.UAA_MEDIA = { videoM3u8: "..." }
    var m = response.text().match(/videoM3u8\s*:\s*"([^"]+)"/);
    if (!m) return Response.error("Không tìm thấy link video");

    return Response.success({
        type: "native",
        data: m[1],
        host: BASE_URL,
        mimeType: "application/x-mpegURL",
        headers: {
            "Referer": BASE_URL + "/"
        }
    });
}
