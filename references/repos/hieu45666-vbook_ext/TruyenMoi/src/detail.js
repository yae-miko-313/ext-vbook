function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        
        let name = doc.select('h3[itemprop="name"]').text();
        if (!name) name = doc.select("h3.truyen-title").text();
        
        let cover = doc.select('img[itemprop="image"]').attr("src");
        if (!cover) cover = doc.select(".book img").attr("src");
        
        let author = doc.select('[itemprop="author"]').text();
        if (!author) author = doc.select(".author").text();
        
        let description = doc.select('[itemprop="description"]').html();
        if (!description) description = doc.select(".desc-text").html();
        
        // Thể loại / chi tiết
        let detail = doc.select(".info").html();
        if (!detail) detail = doc.select(".cat-link").html();
        if (!detail) detail = author; // Tránh lỗi nếu web rỗng thông tin

        return Response.success({
            name: name,
            cover: cover,
            author: author,
            description: description,
            detail: detail,
            host: "https://truyenmoiyy.com"
        });
    }
    return null;
}