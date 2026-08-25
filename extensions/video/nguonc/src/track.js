load('config.js');

function execute(data) {
    if (!data) return Response.error("Link trống");

    // Nếu đã là link stream direct .m3u8 hoặc .mp4
    if (data.indexOf(".m3u8") !== -1 || data.indexOf(".mp4") !== -1) {
        return Response.success({
            type: "native",
            data: data,
            host: BASE_URL,
            mimeType: "application/x-mpegURL",
            headers: {
                "User-Agent": UserAgent.chrome(),
                "Referer": BASE_URL
            }
        });
    }

    // Lấy PROXY_URL được cấu hình từ plugin.json
    var proxyUrl = "";
    try {
        if (typeof PROXY_URL !== "undefined" && PROXY_URL) {
            proxyUrl = String(PROXY_URL).trim();
        } else if (typeof localConfig !== "undefined" && localConfig && typeof localConfig.getItem === "function") {
            var val = localConfig.getItem("PROXY_URL");
            if (val) proxyUrl = String(val).trim();
        }
    } catch (e) {}

    // Xóa trailing slash nếu có
    if (proxyUrl) {
        proxyUrl = proxyUrl.replace(/\/+$/, "");
    }

    if (!proxyUrl) {
        return Response.error("Chưa cấu hình Proxy Worker URL. Vui lòng vào Cài đặt nguồn NguonC để điền URL Worker.");
    }

    var embedUrl = data;
    var streamUrl = proxyUrl + "/playlist.m3u8?url=" + encodeURIComponent(embedUrl);

    return Response.success({
        type: "native",
        data: streamUrl,
        host: BASE_URL,
        mimeType: "application/x-mpegURL",
        headers: {
            "User-Agent": UserAgent.chrome(),
            "Referer": BASE_URL
        }
    });
}


