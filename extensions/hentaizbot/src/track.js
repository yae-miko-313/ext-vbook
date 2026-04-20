load('config.js');

function execute(url) {
    url = normalizeUrl(url);

    if (url.indexOf(".mp4") !== -1 || url.indexOf(".m3u8") !== -1) {
        return Response.success({
            data: url,
            type: "native",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://hentaiz.bot/"
            },
            host: BASE_URL,
            timeSkip: []
        });
    }

    // NATIVE giải mã JS chay cho StreamQQ (Server 1 & 3)
    if (url.indexOf("/play") !== -1 && (url.indexOf("streamqq") !== -1 || url.indexOf("trivonix") !== -1 || url.indexOf("spexliu") !== -1)) {
        
        // Mẹo nhảy domain trực tiếp để né vụ redirect 302 của e.streamqq
        var finalUrl = url.split('?')[0];
        finalUrl = finalUrl.replace("e.streamqq.com", "p1.spexliu.top");
        
        var configUrl = finalUrl.replace("/play", "/config");
        var originUrl = finalUrl.split("/videos")[0];
        
        try {
            // JSoup Http.post BẮT BUỘC phải có body() (dù là object rỗng)
            // Nếu không có body() nó sẽ văng Exception và lỗi tự chuyển sang auto
            var configRes = Http.post(configUrl).body("{}").headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': finalUrl,
                'Content-Type': 'application/json',
                'Origin': originUrl,
                'Accept': 'application/json'
            }).string();

            if (configRes) {
                var json = JSON.parse(configRes);
                if (json && json.sources && json.sources.length > 0) {
                    return Response.success({
                        data: json.sources[0].file,
                        type: "native",
                        headers: {
                            "Referer": finalUrl,
                            "User-Agent": "Mozilla/5.0"
                        },
                        host: BASE_URL,
                        timeSkip: []
                    });
                }
            }
        } catch (e) {
            // Lỗi thì rớt xuống auto
        }
    }

    return Response.success({
        data: url,
        type: "auto",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://hentaiz.bot/"
        },
        host: BASE_URL,
        timeSkip: []
    });
}
