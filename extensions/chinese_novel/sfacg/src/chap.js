load('config.js');

function execute(url) {
    url = normalizeUrl(url);

    let response = httpGet(url);
    if (!response.ok) return Response.error("HTTP " + response.status);

    let doc = response.html();
    let htm = "";
    let body = doc.select("#ChapterBody");
    if (!body.isEmpty()) {
        htm = body.html();
    } else {
        let mobileBody = doc.select(".yuedu > div[style*='text-indent']");
        if (mobileBody.isEmpty()) mobileBody = doc.select(".yuedu");
        htm = mobileBody.html();
    }

    if (url.indexOf("/vip/") !== -1 || !doc.select(".icn_vip").isEmpty()) {
        if (!htm || htm.trim() === "") {
            htm = "Chương VIP, cần đăng nhập hoặc mua trên web để đọc.";
        }
    }

    let title = doc.select("h1.article-title").text().trim();
    if (!title) title = doc.select(".article-title").text().trim();
    if (!title) {
        let mobileLis = doc.select(".menu_top_list li");
        if (mobileLis.size() > 1) title = mobileLis.get(1).text().trim();
    }

    return Response.success(htm, title);
}
