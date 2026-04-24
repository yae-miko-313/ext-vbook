load('config.js');

// TRACK v2 — Direct Only (Không browser extract)
// Chỉ hoạt động với: DU server (bysezejataos.com) và direct MP4/M3U8
// Các nguồn embed (dailymotion, ok.ru, rumble, abysscdn...) KHÔNG hỗ trợ

var DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": BASE_URL + "/"
};

// Chỉ hỗ trợ các nguồn direct
var SUPPORTED_SOURCES = [
    {
        name: "du",
        test: function(url) { return url.indexOf("bysezejataos.com/") >= 0; },
        referer: BASE_URL
    },
    {
        name: "direct",
        test: function(url) { return url.match(/\.(mp4|m3u8|webm)(\?|$)/i); },
        referer: BASE_URL
    }
];

// Kiểm tra nguồn có được hỗ trợ không
function findSource(url) {
    for (var i = 0; i < SUPPORTED_SOURCES.length; i++) {
        if (SUPPORTED_SOURCES[i].test(url)) return SUPPORTED_SOURCES[i];
    }
    return null;
}

// ===== MAIN EXECUTE =====
function execute(input) {
    var url;
    if (typeof input === "string") {
        url = input;
    } else if (Array.isArray(input) && input.length > 0) {
        url = input[0];
    } else if (input && typeof input === "object" && input.url) {
        url = input.url;
    } else {
        Log.log("[TRACK] Invalid input");
        return Response.success({ data: "", type: "auto", host: BASE_URL });
    }

    url = normalizeUrl(url);
    Log.log("[TRACK] Input: " + url);

    // Fetch episode page
    var resp = fetch(url, { headers: DEFAULT_HEADERS });
    if (!resp.ok) {
        Log.log("[TRACK] Fetch failed");
        return Response.success({ data: url, type: "auto", host: BASE_URL });
    }

    // Extract video URL từ player_aaaa
    var html = resp.text();
    var videoUrl = "";
    var pdMatch = html.match(/var\s+player_aaaa\s*=\s*\{[^}]+\}/i);
    if (pdMatch) {
        var urlMatch = pdMatch[0].match(/"url"\s*:\s*"([^"]+)"/i);
        if (urlMatch) videoUrl = urlMatch[1].replace(/\\\//g, "/");
    }

    if (!videoUrl) {
        Log.log("[TRACK] No video URL in page");
        return Response.success({ data: url, type: "auto", host: BASE_URL });
    }

    Log.log("[TRACK] Raw URL: " + videoUrl);

    // Kiểm tra nguồn có được hỗ trợ không
    var source = findSource(videoUrl);
    
    if (!source) {
        Log.log("[TRACK] Unsupported source: " + videoUrl);
        // Trả về URL gốc với type auto, app sẽ thông báo lỗi
        return Response.success({
            data: videoUrl,
            type: "auto",
            headers: {},
            host: BASE_URL,
            timeSkip: []
        });
    }

    Log.log("[TRACK] Source: " + source.name);

    // Trả về trực tiếp cho nguồn được hỗ trợ
    return Response.success({
        data: videoUrl,
        type: "native",
        headers: { "Referer": source.referer },
        host: BASE_URL,
        timeSkip: []
    });
}