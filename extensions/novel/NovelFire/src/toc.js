function execute(url) {
    var res = fetch(url);
    if (!res.ok) return null;
    var doc = res.html();
    var chaps = [];
    
    doc.select("time, .time, .text-muted").remove();
    var elements = doc.select("ul.chapter-list li a");
    
    for (var i = 0; i < elements.size(); i++) {
        var e = elements.get(i);
        var link = e.attr("href");
        if (link.indexOf("http") !== 0) link = "https://novelfire.net" + (link.indexOf("/") === 0 ? "" : "/") + link;
        
        var rawName = e.text().trim().replace(/\s+/g, ' ');
        var titleAttr = e.attr("title");
        
        if (titleAttr && titleAttr.length > rawName.length) {
            rawName = titleAttr.trim();
        }
        
        // --- THUẬT TOÁN REGEX LÀM SẠCH TIÊU ĐỀ ---
        rawName = rawName.replace(/^\d+\s+(Chapter|Chương)/i, "$1");
        rawName = rawName.replace(/(Chapter\s*\d+)[\s:.-]+(?:Chapter\s*\d+[\s:.-]*)+/gi, "$1");
        rawName = rawName.replace(/^(Chapter\s*\d+)\s*-\s*\d+\s*[:-]\s*/i, "$1: ");
        rawName = rawName.replace(/[\s:.-]+$/, "").trim();
        
        chaps.push({name: rawName, url: link, host: "https://novelfire.net"});
    }
    return Response.success(chaps);
}
