load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    url = normalizeUrl(url);
    // Use loadDocument with requiredSelector to support headless browser render if the static page has no chapters
    var doc = loadDocument(url, 20000, ".tab-chap .chapters ul li a");
    if (!doc) return Response.success([]);
    
    var list = [];
    var buttons = doc.select(".tabs .tab-but");
    
    if (getSize(buttons) > 0) {
        for (var i = 0; i < getSize(buttons); i++) {
            var btn = getElement(buttons, i);
            if (!btn) continue;
            
            var sectionName = cleanText(btn.text());
            // Skip the "Mới nhất" (latest) section
            if (sectionName.indexOf("Mới nhất") >= 0 || sectionName.toLowerCase() === "mới nhất" || i === 0) {
                continue;
            }
            
            var contentEl = null;
            var btnClass = btn.attr("class") || "";
            var numMatch = btnClass.match(/tab-but-(\d+)/);
            if (numMatch) {
                contentEl = doc.select(".tab-content-" + numMatch[1]).first();
            }
            
            if (!contentEl) {
                var contents = doc.select(".tab-content.tab-chap");
                if (i < getSize(contents)) {
                    contentEl = getElement(contents, i);
                }
            }
            
            if (contentEl) {
                list.push({
                    name: sectionName,
                    type: "section"
                });
                
                var chaps = contentEl.select(".chapters ul li a");
                for (var j = 0; j < getSize(chaps); j++) {
                    var chapA = getElement(chaps, j);
                    if (!chapA) continue;
                    
                    var chapName = cleanText(chapA.text());
                    var chapHref = chapA.attr("href");
                    if (chapName && chapHref) {
                        list.push({
                            name: chapName,
                            url: normalizeUrl(chapHref),
                            host: BASE_URL
                        });
                    }
                }
            }
        }
    } else {
        var el = doc.select(".tab-chap .chapters ul li a");
        if (getSize(el) === 0) el = doc.select(".chapters ul li a");
        
        for (var i = 0; i < getSize(el); i++) {
            var e = getElement(el, i);
            if (!e) continue;
            
            var name = cleanText(e.text());
            var href = e.attr("href");
            if (name && href) {
                list.push({
                    name: name,
                    url: normalizeUrl(href),
                    host: BASE_URL
                });
            }
        }
    }
    
    return Response.success(list);
}