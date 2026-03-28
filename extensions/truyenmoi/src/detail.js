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
        
        // Thể loại / chi tiết
        let detail = root.select(".info").html();
        if (!detail) detail = root.select(".cat-link").html();
        if (!detail) detail = author; // Tránh lỗi nếu web rỗng thông tin

        return Response.success({
            name: name,
            cover: cover,
            author: author,
            description: description,
            detail: detail,
            host: "https://truyenmoikk.com"
        });
    }
    return null;
}