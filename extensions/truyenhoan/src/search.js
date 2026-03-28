load('config.js');

function execute(query, page) {
    page = page || 1;
    
    var url = BASE_URL + "/?s=" + encodeURIComponent(query);
    if (page > 1) {
        url += "&paged=" + page;
    }
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var novels = [];
    
    doc.select("a[href*='\\.'][href*='/']").forEach(function(a) {
        var title = a.text().trim();
        var link = a.attr("href") || "";
        if (link.match(/\.\d+\/?$/) && 
            title.length > 2 && 
            title.length < 200 &&
            title.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
            novels.push({
                title: title,
                input: link,
                cover: ""
            });
        }
    });
    
    return Response.success(novels.slice(0, 20));
}
