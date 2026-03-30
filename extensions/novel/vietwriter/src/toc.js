load("config.js");
function execute(url) {
    try {
        var chapters = [];
        var seenIds = {};
        var baseUrl = url.replace(/\/$/, "").replace(/\/page-\d+$/, "");
        var garbageRegex = /^(?:\[.*?\]|\(.*?\)|hot|new|full|hoàn thành|hoàn|update|cập nhật)\s*[-_:\.]?\s*/i;
        var dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b\s*/g;
        var prefixRegex = /(^(?:Chương\s*)?\d+\s*[:\.\-]\s*)(?:Chương\s*\d+\s*[\.\-\:]\s*)(.*)/i;
        var postRegex = /(?:post-|posts\/|threadmarks\/)(\d+)/;
        function add(href, rawName, postId) {
            if (!postId || seenIds[postId]) return;
            seenIds[postId] = true;
            var link = href.split("?")[0].split("#")[0]; 
            if (link.indexOf("/") === 0) link = BASE_URL + link;
            var name = rawName.trim();
            while (garbageRegex.test(name)) name = name.replace(garbageRegex, "").trim();
            name = name.replace(dateRegex, "").replace(prefixRegex, '$1$2').trim();
            if (!name) name = "Chương " + (chapters.length + 1);
            chapters.push({ name: name, url: link, host: BASE_URL, id: postId });
        }
        function extractLinks(doc, selector) {
            doc.select(selector).forEach(function(l) {
                var href = l.attr("href");
                if (!href || href.indexOf("/members/") !== -1 || href.indexOf("/latest") !== -1) return;
                var match = href.match(postRegex);
                if (match) {
                    var span = l.select(".threadmark-text").text();
                    add(href, span ? span.trim() : l.text().trim(), parseInt(match[1]));
                }
            });
        }
        var listUrl = baseUrl + "/danh-sach-chuong";
        var res = fetch(listUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) listUrl = baseUrl + "/threadmarks";
        var nextUrl = listUrl;
        while (nextUrl) {
            var docRes = fetch(nextUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!docRes.ok) break;
            var doc = docRes.html();
            extractLinks(doc, ".structItem--threadmark a.threadmark-link, .threadmarkItem a");
            var nextBtn = doc.select(".pageNav-jump--next").first();
            nextUrl = nextBtn ? nextBtn.attr("href") : null;
            if (nextUrl && nextUrl.indexOf("/") === 0) nextUrl = BASE_URL + nextUrl;
        }
        var baseRes = fetch(baseUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (baseRes.ok) {
            var baseDoc = baseRes.html();
            var maxPage = 1, threadAuthor = "";
            var authorEl = baseDoc.select(".p-description a.username").first() || baseDoc.select(".message-userDetails .username").first();
            if (authorEl) threadAuthor = authorEl.text().trim();
            var lastPage = baseDoc.select(".pageNav-main .pageNav-page a").last();
            if (lastPage) maxPage = parseInt(lastPage.text().trim()) || 1;
            if (chapters.length < maxPage * 4) {
                var tUrl = baseUrl;
                while (tUrl) {
                    var tRes = fetch(tUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    if (!tRes.ok) break;
                    var tDoc = tRes.html();
                    tDoc.select("article.message--post").forEach(function(post) {
                        if (threadAuthor && post.attr("data-author") !== threadAuthor) return;
                        var content = post.select(".message-body .bbWrapper");
                        if (content.text().trim().length < 200) return;
                        var headerLink = post.select("header a[href*='post-']").last();
                        if (headerLink) {
                            var href = headerLink.attr("href");
                            var match = href.match(postRegex);
                            if (match && !seenIds[parseInt(match[1])]) {
                                var rawName = "", lines = (content.html() || "").split(/<br\s*\/?>|\n/i);
                                for (var i = 0; i < Math.min(lines.length, 5); i++) {
                                    var line = lines[i].replace(/<[^>]+>/g, '').trim();
                                    if (line.toLowerCase().indexOf("chương") !== -1 && line.length > 4 && line.length < 150) {
                                        rawName = line; break;
                                    }
                                }
                                if (!rawName) {
                                    var bTag = post.select(".message-body .bbWrapper b, .message-body .bbWrapper strong").first();
                                    if (bTag && bTag.text().trim().length > 2) rawName = bTag.text().trim();
                                }
                                add(href, rawName || "Chương " + (chapters.length + 1), parseInt(match[1]));
                            }
                        }
                    });
                    var nBtn = tDoc.select(".pageNav-jump--next").first();
                    tUrl = nBtn ? nBtn.attr("href") : null;
                    if (tUrl && tUrl.indexOf("/") === 0) tUrl = BASE_URL + tUrl;
                }
            }
        }
        if (chapters.length > 0) {
            chapters.sort(function(a, b) { return a.id - b.id; });
            chapters.forEach(function(c, index) { 
                delete c.id; 
                if (c.name.toLowerCase().indexOf("chương") === -1 && !c.name.match(/\d/)) {
                    c.name = "Chương " + (index + 1) + ": " + c.name;
                } else if (/^\d+$/.test(c.name)) {
                    c.name = "Chương " + c.name;
                }
            });
        }
        return Response.success(chapters);
    } catch (e) { 
        return Response.success([{ name: "🚨 BUG TOC: " + e.message, url: "error", host: "Error" }]); 
    }
}