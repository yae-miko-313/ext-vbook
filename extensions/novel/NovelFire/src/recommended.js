function execute(input) {
    if (!input) return Response.success([]);
    
    var apiRes = fetch("https://novelfire.net/ajax/novelYouMayLike?post_id=" + input);
    if (!apiRes.ok) return Response.success([]);
    
    var doc;
    try {
        var rJson = JSON.parse(apiRes.text());
        doc = Html.parse(rJson.html || "");
    } catch(ex) {
        doc = Html.parse(apiRes.text());
    }
    
    var data = [];
    doc.select("li, .novel-item").forEach(function(e) {
        var a = e.select("a").first();
        if (a) {
            var link = a.attr("href");
            if (link && link.indexOf("http") !== 0) link = "https://novelfire.net" + (link.indexOf("/") === 0 ? "" : "/") + link;
            
            var title = e.select(".novel-title, h3, h4").text().trim() || a.attr("title").trim();
            var img = e.select("img").first();
            var cover = img ? (img.attr("data-src") || img.attr("src")) : "";
            if (cover && cover.indexOf("http") !== 0) cover = "https://novelfire.net" + (cover.indexOf("/") === 0 ? "" : "/") + cover;
            
            if (title && link) {
                data.push({
                    name: title,
                    link: link,
                    cover: cover || "",
                    description: "",
                    host: "https://novelfire.net"
                });
            }
        }
    });
    
    return Response.success(data);
}
