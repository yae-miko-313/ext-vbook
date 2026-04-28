load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    
    // Fetch trực tiếp
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.7"
        }
    });
    
    if (!response.ok) return Response.success([]);
    
    var doc = response.html();
    if (!doc) return Response.success([]);
    
    var list = [];
    
    // Find all server blocks
    var servers = doc.select(".halim-server");
    
    servers.forEach(function(server) {
        var serverNameEl = server.select(".halim-server-name").first();
        var serverName = serverNameEl ? cleanText(serverNameEl.text()) : "Server";
        // Remove SVG icon text
        serverName = serverName.replace(/^#/, "").trim();
        if (!serverName) serverName = "Server";
        
        list.push({ name: serverName, type: "section" });
        
        var episodes = server.select(".halim-episode a");
        var epArray = [];
        
        episodes.forEach(function(a) {
            var epUrl = a.attr("href") || "";
            var epTitle = a.attr("title") || cleanText(a.text());
            
            if (!epUrl || epUrl.indexOf("/watch-") < 0) return;
            if (!epTitle) return;
            
            if (epUrl.indexOf("http") !== 0) {
                epUrl = BASE_URL + epUrl;
            }
            
            epArray.push({
                name: epTitle,
                url: epUrl,
                host: BASE_URL
            });
        });
        
        // Sort by episode number (descending - newest first)
        epArray.sort(function(a, b) {
            var numA = (a.url.match(/tap-(\d+)/) || [0, 0])[1];
            var numB = (b.url.match(/tap-(\d+)/) || [0, 0])[1];
            return parseInt(numB, 10) - parseInt(numA, 10);
        });
        
        for (var i = 0; i < epArray.length; i++) {
            list.push(epArray[i]);
        }
    });
    
    // Fallback: if no servers found, try direct episode links
    if (list.length === 0) {
        var allEpLinks = doc.select("a[href*='/watch-']");
        var seen = {};
        
        allEpLinks.forEach(function(a) {
            var href = a.attr("href") || "";
            if (!href || seen[href]) return;
            seen[href] = true;
            
            var title = a.attr("title") || cleanText(a.text());
            if (!title) return;
            
            if (href.indexOf("http") !== 0) {
                href = BASE_URL + href;
            }
            
            list.push({
                name: title,
                url: href,
                host: BASE_URL
            });
        });
    }
    
    return Response.success(list);
}
