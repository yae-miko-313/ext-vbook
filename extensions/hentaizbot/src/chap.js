load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = Http.get(url).html();
    
    
    if (!doc || doc.select(".player__cdn").size() === 0) {
        var browser = Engine.newBrowser();
        doc = browser.launch(url, 5000);
        browser.close();
    }
    
    if (doc) {
        let tracks = [];
        let servers = doc.select(".player__cdn");
        
        if (servers.size() > 0) {
            let bestTrack = null;
            let fallbackTrack = null;
            for (let i = 0; i < servers.size(); i++) {
                let item = servers.get(i);
                let serverUrl = item.attr("data-source");
                if (serverUrl) {
                    let trackInfo = {
                        title: "Play Video", // Chỉ hiển thị 1 Nút dễ nhìn cho User
                        data: normalizeUrl(serverUrl)
                    };
                    if (!fallbackTrack) fallbackTrack = trackInfo;
                    
                    // Ưu tiên dùng StreamQQ / Trivonix vì dễ Native lấy link m3u8
                    if (serverUrl.indexOf("streamqq") !== -1 || serverUrl.indexOf("trivonix") !== -1 || serverUrl.indexOf("spexliu") !== -1) {
                        bestTrack = trackInfo;
                        break; // Tìm được 1 cái dễ nhất là ngắt luôn
                    }
                }
            }
            if (bestTrack) {
                tracks.push(bestTrack);
            } else if (fallbackTrack) {
                tracks.push(fallbackTrack);
            }
        } else {
            tracks.push({
                title: "Server 1",
                data: url
            });
        }

        return Response.success(tracks);
    }
    return null;
}
