load('config.js');

function execute(input) {
    var keyword = "";
    var page = "1";
    
    if (typeof input === "string") {
        keyword = input;
    } else if (Array.isArray(input)) {
        keyword = input[0] || "";
        page = input[1] || "1";
    }
    
    if (!keyword) return Response.success([]);
    
    var searchUrl = BASE_URL + "/search?q=" + encodeURIComponent(keyword).replace(/%20/g, "+");
    if (page !== "1") searchUrl += "&page=" + page;
    
    var response = fetch(searchUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": BASE_URL + "/"
        }
    });
    
    if (!response.ok) return Response.success([]);
    
    var doc = response.html();
    if (!doc) return Response.success([]);
    
    var list = parseStoryList(doc);
    
    var next = null;
    if (list.length >= 20) next = (parseInt(page, 10) + 1).toString();
    
    return Response.success(list, next);
}
