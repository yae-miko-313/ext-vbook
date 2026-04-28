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
    
    var servers = [];
    
    // Parse quality/server options from page if available
    var qualityButtons = doc.select(".get-eps.play-listsv");
    if (qualityButtons.size() > 0) {
        qualityButtons.forEach(function(btn) {
            var type = btn.attr("data-type") || "";
            var title = cleanText(btn.text()) || type;
            if (!title) title = "Server " + type;
            
            servers.push({
                title: title,
                data: url + "#" + type
            });
        });
    }
    
    // Luôn thêm các server mặc định bằng cách thay đổi sv trong URL
    // Ví dụ: .../tap-1-sv2.html -> .../tap-1-sv1.html
    var svList = [
        { id: "1", name: "Vietsub (SV1)" },
        { id: "2", name: "Thuyết Minh (SV2)" },
        { id: "3", name: "Dự phòng (SV3)" }
    ];
    
    svList.forEach(function(sv) {
        var newUrl = url;
        if (url.indexOf("-sv") > 0) {
            newUrl = url.replace(/-sv\d+/, "-sv" + sv.id);
        } else {
            newUrl = url.replace(/\.html$/, "-sv" + sv.id + ".html");
        }
        
        // Tránh trùng lặp với các server đã parse được
        var isDuplicate = false;
        for (var i = 0; i < servers.length; i++) {
            if (servers[i].title.indexOf(sv.id) >= 0) {
                isDuplicate = true;
                break;
            }
        }
        
        if (!isDuplicate) {
            servers.push({
                title: sv.name,
                data: newUrl
            });
        }
    });
    
    return Response.success(servers);
}
