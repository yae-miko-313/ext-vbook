function execute(url, page) {
    if (!page) page = "1";
    var fetchUrl = url + (url.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
    
    var response = fetch(fetchUrl);
    if (!response || !response.ok) return Response.error("Máy chủ Webnovel phản hồi chậm.");
    
    var doc = response.html();
    var data = [];
    
    // BƯỚC 1: Xóa sạch các khu vực chứa "nội dung nhầm" (Logo, Menu, Footer, Sidebar)
    doc.select("header, footer, nav, aside, .site-header, .site-footer, script, style, #accountDrawer").remove();
    
    // BƯỚC 2: Nhắm đúng các cấu trúc thẻ truyện dựa trên mã nguồn thực tế
    // .catx-card: Thẻ truyện ô lưới, .book-listing: Danh sách truyện cập nhật, .book-card: Thẻ truyện xếp hạng
    var items = doc.select(".catx-card, .book-listing, .book-card, .book-list__item, .book-item");
    
    items.forEach(function(el) {
        var link = el.select("a").first().attr("href");
        var img = el.select("img").first();
        if (!img || !link) return;

        var cover = img.attr("data-src") || img.attr("src");
        var name = img.attr("alt") || el.select(".catx-card__title, .book-listing__title, .book-card__title, h3").text().trim();
        
        // BƯỚC 3: Màng lọc chất lượng cao (Chống lấy nhầm logo/icon)
        if (link === "/" || link.indexOf("/the-loai/") > -1 || link.indexOf("/tac-gia/") > -1) return;
        if (cover.indexOf("logo") > -1 || cover.indexOf("icon") > -1 || name.length < 2) return;

        // Làm sạch tên truyện
        name = name.replace(/Truyện/gi, "").replace(/WebNovel\.vn/gi, "").trim();
        
        data.push({
            name: name,
            link: link,
            cover: cover,
            description: el.select(".catx-meta__text, .book-listing__genre, .author").first().text().trim() || "@R",
            host: "https://webnovel.vn"
        });
    });
    
    if (data.length === 0) return Response.success(data);
    return Response.success(data, (parseInt(page) + 1).toString());
}
