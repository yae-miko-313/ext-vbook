load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    url = normalizeUrl(url);
    var doc = loadDocument(url, 20000, ".story-content article");
    if (!doc) doc = loadDocument(url, 20000, ".story-content");
    if (!doc) return Response.error("Không thể tải nội dung chương");

    var contentEl = doc.select(".story-content article").first();
    if (!contentEl) contentEl = doc.select(".story-content").first();
    if (!contentEl) contentEl = doc.select("#content .ads-content > article").first();

    if (contentEl) {
        contentEl.select("noscript, style, script, iframe, ins, .ads-class, .pikachu, .d-none").remove();
        contentEl.select("a").remove();
        contentEl.select("div").remove();

        var htmlContent = contentEl.html();
        if (htmlContent) {
            htmlContent = htmlContent.replace(/<p>\s*\.\s+([^.]*)/g, "<p>$1")
                                     .replace(/ⓚ|к/g, "k")
                                     .replace(/ⓒ/g, "c")
                                     .replace(/kyhuyen\.com/gi, "")
                                     .replace(/kyhuyencom/gi, "");
            return Response.success(htmlContent);
        }
    }
    return Response.error("Nội dung chương trống");
}

