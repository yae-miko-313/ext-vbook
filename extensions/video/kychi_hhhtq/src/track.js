load('config.js');

// TRACK — Stream URL Resolver
// Input: URL trang xem phim /xem/{id}-sv{n}-ep{n}/ (từ chap.js)
// Output: link m3u8/mp4 hoặc iframe để player render
//
// Site pattern: var player_aaaa = {"url":"...","encrypt":"0",...}
// encrypt=0: URL thuần, dùng trực tiếp
// encrypt=1: URL đã URL-encode, cần unescape()
// encrypt=2: URL base64-encode, cần atob() hoặc java.util.Base64

var DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
    "Referer": BASE_URL + "/",
    "Origin": BASE_URL
};

function execute(url) {
    url = normalizeUrl(url);

    var response = fetch(url, {
        headers: DEFAULT_HEADERS
    });

    if (!response.ok) {
        return Response.success({
            data: url,
            type: "native",
            headers: DEFAULT_HEADERS,
            host: BASE_URL,
            timeSkip: []
        });
    }

    var html = response.text();
    if (!html || html.length < 100) {
        return Response.success({
            data: url,
            type: "native",
            headers: DEFAULT_HEADERS,
            host: BASE_URL,
            timeSkip: []
        });
    }

    // Tìm var player_aaaa = {...} hoặc var player_data = {...}
    var pdMatch = html.match(/var\s+player_(?:aaaa|data|config)\s*=\s*(\{[\s\S]*?\});?/i);
    var playerData = null;

    if (pdMatch) {
        var jsonStr = pdMatch[1].trim();
        try {
            // Simple eval-like approach for Rhino compatibility
            playerData = eval("(" + jsonStr + ")");
        } catch (e1) {
            try {
                playerData = JSON.parse(jsonStr);
            } catch (e2) {
                playerData = null;
            }
        }
    }

    // Thử tìm các định dạng player khác
    if (!playerData) {
        var altMatch = html.match(/var\s+(?:player|embed|video|source)\s*=\s*(\{[\s\S]*?\});?/i);
        if (altMatch) {
            try {
                playerData = eval("(" + altMatch[1] + ")");
            } catch (e) {
                playerData = null;
            }
        }
    }

    // Không tìm thấy player data — thử extract từ archive.org
    if (!playerData) {
        // Check archive.org embed
        if (url.indexOf("archive.org/embed/") >= 0 || url.indexOf("archive.org/download/") >= 0) {
            // Extract archive.org video ID
            var archiveId = "";
            var idMatch = url.match(/embed\/([^\/\?]+)/);
            if (idMatch) archiveId = idMatch[1];
            if (!archiveId) {
                var dlMatch = url.match(/download\/([^\/]+)/);
                if (dlMatch) archiveId = dlMatch[1];
            }
            
            if (archiveId) {
                // Build direct MP4 URL: https://archive.org/download/{id}/{id}.mp4
                var mp4Url = "https://archive.org/download/" + archiveId + "/" + archiveId + ".mp4";
                return Response.success({
                    data: mp4Url,
                    type: "native",
                    headers: {
                        "User-Agent": DEFAULT_HEADERS["User-Agent"],
                        "Referer": "https://archive.org/",
                        "Origin": "https://archive.org"
                    },
                    host: BASE_URL,
                    timeSkip: []
                });
            }
        }
        
        // Fallback: trả về chính URL này dưới dạng native
        return Response.success({
            data: url,
            type: "native",
            headers: DEFAULT_HEADERS,
            host: BASE_URL,
            timeSkip: []
        });
    }

    // Lấy URL từ player data
    var rawUrl = playerData.url || playerData.link || playerData.src || playerData.file || "";
    var encrypt = playerData.encrypt || playerData.enc || "0";
    encrypt = "" + encrypt; // Convert to string
    var streamUrl = "" + rawUrl; // Convert to string

    // Xử lý mã hóa
    if (encrypt === "1" || encrypt === "urlencode") {
        try {
            streamUrl = decodeURIComponent(streamUrl);
        } catch (e) {
            // Keep original if decode fails
        }
    } else if (encrypt === "2" || encrypt === "base64") {
        // Skip base64 decode for now - return as iframe
        streamUrl = "" + rawUrl;
    }

    // Xác định type dựa trên URL hoặc field "from"
    var streamType = "auto";
    var from = playerData.from || playerData.server || "";
    from = ("" + from).toLowerCase();

    if (!streamUrl || streamUrl.length < 5) {
        return Response.success({
            data: url,
            type: "native",
            headers: DEFAULT_HEADERS,
            host: BASE_URL,
            timeSkip: []
        });
    }

    // Check archive.org embed URL - convert to stream MP4
    if (streamUrl.indexOf("archive.org/embed/") >= 0) {
        var embedIdMatch = streamUrl.match(/embed\/([^\/\?]+)/);
        if (embedIdMatch) {
            var archiveId = embedIdMatch[1];
            // Use stream endpoint which redirects to CDN
            streamUrl = "https://archive.org/stream/" + archiveId + "/" + archiveId + ".mp4";
        }
    }

    // Use native for direct video playback
    streamType = "native";

    return Response.success({
        data: streamUrl,
        type: streamType,
        headers: DEFAULT_HEADERS,
        host: BASE_URL,
        timeSkip: []
    });
}


