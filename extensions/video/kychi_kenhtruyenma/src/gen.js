load('config.js');

function execute(input) {
    var url = "";
    var page = "1";
    
    if (typeof input === "string") {
        url = input;
    } else if (Array.isArray(input)) {
        url = input[0] || "";
        page = input[1] || "1";
    }
    
    if (!url) return Response.success([]);
    url = normalizeUrl(url);
    
    if (page !== "1") {
        if (url.indexOf("?") >= 0) url += "&page=" + page;
        else url += "?page=" + page;
    }
    
    var response = fetch(url, {
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
    var nextLink = doc.select(".pagination a[rel='next'], a[href*='page=" + (parseInt(page, 10) + 1) + "']").first();
    if (nextLink || list.length >= 20) {
        next = (parseInt(page, 10) + 1).toString();
    }
    
    return Response.success(list, next);
}
