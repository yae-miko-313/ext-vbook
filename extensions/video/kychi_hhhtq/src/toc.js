load('config.js');

// TOC — trang /phim/{id}/
function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": BASE_URL + "/"
        }
    });
    
    if (!response.ok) {
        return Response.success([]);
    }
    
    var doc = response.html();
    if (!doc) {
        return Response.success([]);
    }
    var list = [];

    // Tìm các server containers (#playlist1, #playlist2, #playlist3, #playlist4...)
    var servers = ["#playlist1", "#playlist2", "#playlist3", "#playlist4"];
    var serverNames = ["Server 1", "Server 2", "Server 3", "Server 4"];

    var foundAny = false;
    for (var i = 0; i < servers.length; i++) {
        var container = doc.select(servers[i]).first();
        if (container) {
            var episodes = container.select("a[href*='/xem/']");
            if (episodes.size() > 0) {
                list.push({ name: serverNames[i], type: "section" });
                // Chuyển elements thành array để có thể reverse
                var epArray = [];
                episodes.forEach(function(a) {
                    var epUrl = a.attr("href") || "";
                    var epTitle = a.attr("title") || a.text().trim();
                    // Lọc bỏ tập rỗng hoặc không hợp lệ
                    if (!epUrl || epUrl.indexOf("/xem/") < 0) return;
                    if (!epTitle || epTitle.length < 1) {
                        // Extract episode number from URL
                        var epMatch = epUrl.match(/-ep(\d+)/);
                        epTitle = epMatch ? "Tập " + epMatch[1] : "Tập";
                    }
                    // Đảm bảo URL đầy đủ
                    if (epUrl.indexOf("http") !== 0) {
                        epUrl = BASE_URL + epUrl;
                    }
                    epArray.push({
                        name: epTitle,
                        url: epUrl,
                        host: BASE_URL
                    });
                });
                // Reverse để tập 1, 2, 3... thay vì 20, 19, 18...
                epArray.reverse();
                for (var k = 0; k < epArray.length; k++) {
                    list.push(epArray[k]);
                }
                foundAny = true;
            }
        }
    }

    // Fallback nếu không tìm thấy bằng ID server
    if (!foundAny) {
        var allEpLinks = doc.select("a[href*='/xem/']");
        var serverMap = {};
        var serverOrder = [];

        allEpLinks.forEach(function(a) {
            var href = a.attr("href") || "";
            // Regex match: /xem/243-sv1-ep1/
            var svMatch = href.match(/-sv(\d+)-/);
            var svKey = svMatch ? "Server " + svMatch[1] : "Server 1";

            if (!serverMap[svKey]) {
                serverMap[svKey] = [];
                serverOrder.push(svKey);
            }

            // Đảm bảo URL đầy đủ
            if (href.indexOf("http") !== 0) {
                href = BASE_URL + href;
            }

            serverMap[svKey].push({
                name: a.attr("title") || a.text().trim() || href,
                url: href
            });
        });

        for (var i = 0; i < serverOrder.length; i++) {
            var sv = serverOrder[i];
            list.push({ name: sv, type: "section" });
            var eps = serverMap[sv];
            // Reverse episodes để tập 1, 2, 3... thay vì ngược
            eps.reverse();
            for (var j = 0; j < eps.length; j++) {
                list.push({ name: eps[j].name, url: eps[j].url, host: BASE_URL });
            }
        }
    }

    return Response.success(list);
}

