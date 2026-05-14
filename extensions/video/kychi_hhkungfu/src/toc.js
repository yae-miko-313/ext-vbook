load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });
    
    if (!response.ok) return Response.success([]);
    var doc = response.html();
    
    var episodes = doc.select(".halim-episode a");
    var list = [];
    var seen = {};
    
    episodes.forEach(function(a) {
        var name = cleanText(a.text());
        var href = a.attr("href");
        if (!name || !href || seen[name]) return;
        seen[name] = true;
        
        list.push({
            name: name,
            url: normalizeUrl(href),
            host: BASE_URL
        });
    });
    
    // Sort episodes (assuming name like "Tập 1", "Tập 2"...)
    list.sort(function(a, b) {
        var numA = parseInt((a.name.match(/\d+/) || [0])[0]);
        var numB = parseInt((b.name.match(/\d+/) || [0])[0]);
        return numB - numA; // Newest first
    });
    
    return Response.success(list);
}

