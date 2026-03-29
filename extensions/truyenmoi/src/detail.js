function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();

        // Limit lookup to the main book container to avoid taking related-book titles.
        let root = doc.select(".col-truyen-main[itemscope]").first();
        if (!root) root = doc;

        let name = root.select('h1.story-title[itemprop="name"]').text().trim();
        if (!name) name = root.select('h1[itemprop="name"]').text().trim();
        if (!name) name = doc.select('meta[property="og:title"]').attr("content").trim();
        if (!name) name = doc.select("title").text().trim();
        
        let cover = root.select('img[itemprop="image"]').attr("src");
        if (!cover) cover = root.select(".book img").attr("src");
        
        let author = root.select('[itemprop="author"] [itemprop="name"]').text().trim();
        if (!author) author = root.select('[itemprop="author"]').text().trim();
        if (!author) author = root.select(".author").text().trim();
        
        let description = root.select('[itemprop="description"]').html();
        if (!description) description = root.select(".desc-text").html();
        if (!description) description = "";
        
        // Status: map "đang cập nhật" -> "Đang ra", "hoàn thành" -> "Hoàn thành"
        let statusText = root.text();
        let ongoing = true;
        if (statusText.indexOf("hoàn thành") >= 0 || statusText.indexOf("Hoàn thành") >= 0 ||
            statusText.indexOf("Đã hoàn thành") >= 0) {
            ongoing = false;
        }
        
        // Thể loại / chi tiết
        let detail = "Tác giả: " + author + "<br>";
        detail += "Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành") + "<br>";
        
        let infoText = root.select(".info").text();
        if (!infoText) infoText = root.select(".cat-link").text();
        if (infoText) detail += "Thể loại: " + infoText;

        return Response.success({
            name: name,
            cover: cover,
            author: author,
            description: description,
            detail: detail,
            host: "https://truyenmoikk.com",
            ongoing: ongoing
        });
    }
    return null;
}