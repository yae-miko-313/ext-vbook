load('config.js');

// Trang phát dựng iframe qua POST /get.video.php, sau đó player trong iframe gọi
// {embedHost}/api/get-video?id=... để lấy link thật -> phải đi qua 2 bước này,
// link không nằm sẵn trong DOM của trang bài viết.
function fetchEmbedUrl(movieId, type) {
    let path = type === "10" ? "/get.xvideo.php" : "/get.video.php";
    let response = fetch(BASE_URL + path, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": UserAgent.chrome(),
            "Referer": BASE_URL + "/"
        },
        body: "movie_id=" + movieId + "&type=" + type + "&index=1"
    });
    if (!response.ok) return "";
    let src = response.html().select("iframe").attr("src");
    return src || "";
}

// API trả JSON phẳng: {"urls":["...m3u8"]} hoặc {"url":"..."} (link blogger, chỉ
// phát được trong player web). Mỗi lần gọi server trả 1 nguồn ngẫu nhiên, phải
// tích luỹ tried_ids như player gốc mới ép nó đổi sang nguồn m3u8.
function pickStreamUrl(embedUrl) {
    let match = embedUrl.match(/^(https?:\/\/[^\/]+)\/embed\/(.+)$/);
    if (!match) return "";

    let host = match[1];
    let videoId = match[2];
    let tried = [];

    for (let i = 0; i < 4; i++) {
        let response = fetch(host + "/api/get-video?id=" + videoId + "&counter=" + i + "&tried_ids=" + tried.join(","), {
            headers: { "User-Agent": UserAgent.chrome(), "Referer": embedUrl }
        });
        if (!response.ok) continue;
        let text = response.text();

        let server = text.match(/"server"\s*:\s*(\d+)/);
        if (server && tried.indexOf(server[1]) === -1) tried.push(server[1]);

        let found = text.match(/"urls"\s*:\s*\[\s*"([^"]+)"/);
        if (!found) continue;

        let link = found[1].replace(/\\\//g, "/");
        if (link.indexOf(".m3u8") !== -1 || link.indexOf(".mp4") !== -1) return link;
    }

    return "";
}

// URL chỉ gồm ký tự ASCII nên giải base64 thủ công là đủ
function decodeBase64(text) {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let out = "";
    let buffer = 0;
    let bits = 0;
    text = text.replace(/-/g, "+").replace(/_/g, "/").replace(/[^A-Za-z0-9+\/]/g, "");
    for (let i = 0; i < text.length; i++) {
        buffer = (buffer << 6) | chars.indexOf(text.charAt(i));
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out += String.fromCharCode((buffer >> bits) & 0xff);
        }
    }
    return out;
}

// Video cũ (type 22): iframe là /player/...?video=<base64 link m3u8>
function decodePlayerVideo(embedUrl) {
    let match = embedUrl.match(/[?&]video=([^&]+)/);
    if (!match) return "";
    let link = decodeBase64(decodeURIComponent(match[1]));
    return /^https?:\/\//.test(link) ? link : "";
}

function execute(data) {
    let mode = "native";
    let handle = data;

    let split = data.match(/^(native|auto|web)\|(.+)$/);
    if (split) {
        mode = split[1];
        handle = split[2];
    }

    let embedUrl = handle;
    if (handle.indexOf("http") !== 0) {
        let parts = handle.split("|");
        let type = parts[1] || "25";
        // Type 19 phát qua chatvl.net (đã chết); cùng movie_id gọi type 22 ra link cd-vs còn sống
        if (type === "19") type = "22";
        embedUrl = fetchEmbedUrl(parts[0], type);
        if (!embedUrl) return Response.error("Không lấy được trình phát");
    }
    if (embedUrl.indexOf("//") === 0) embedUrl = "https:" + embedUrl;
    else if (embedUrl.indexOf("/") === 0) embedUrl = BASE_URL + embedUrl;

    if (mode === "web") {
        return Response.success({
            type: "webview",
            data: embedUrl,
            host: embedUrl,
            headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL + "/" },
            timeSkip: []
        });
    }

    if (mode === "auto") {
        return Response.success({
            type: "auto",
            data: embedUrl,
            host: embedUrl,
            headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL + "/" },
            timeSkip: []
        });
    }

    let stream = decodePlayerVideo(embedUrl) || pickStreamUrl(embedUrl);
    if (!stream) {
        return Response.success({
            type: "auto",
            data: embedUrl,
            host: embedUrl,
            headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL + "/" },
            timeSkip: []
        });
    }

    // Segment trong playlist là đường dẫn tương đối (file-0000.png) nên host phải
    // là thư mục chứa m3u8, không phải BASE_URL của site.
    let base = stream.split("?")[0];
    base = base.substring(0, base.lastIndexOf("/") + 1);

    return Response.success({
        type: "native",
        data: stream,
        host: base,
        mimeType: "application/x-mpegURL",
        headers: { "User-Agent": UserAgent.chrome(), "Referer": embedUrl },
        timeSkip: []
    });
}
