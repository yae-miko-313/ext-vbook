function execute(url, page) {
    if (!page) page = '1';
    // Đảm bảo URL kết thúc bằng dấu / trước khi nối chuỗi phân trang
    var fetchUrl = url.replace(/\/$/, "") + "/trang-" + page + "/";
    
    var response = fetch(fetchUrl);
    if (response.ok) {
        var doc = response.html();
        var data = [];
        var items = doc.select(".list-truyen .row[itemscope]");
        
        for (var i = 0; i < items.size(); i++) {
            var e = items.get(i);
            var rawLink = e.select("h3.truyen-title a").attr("href");
            
            // TÁCH LINK: Lấy phần chữ sau dấu / cuối cùng
            // Ví dụ: https://truyenmoiyy.com/vu-luyen-dien-phong -> vu-luyen-dien-phong
            var slug = rawLink.split('/').filter(Boolean).pop();

            data.push({
                name: e.select("h3.truyen-title a").text(),
                link: slug, 
                cover: e.select(".col-xs-3 img").attr("src"),
                description: e.select(".author").text().trim(),
                host: "https://truyenmoikk.com/"
            });
        }
        
        // Phân trang
        var next = doc.select(".pagination li.active + li a").text();
        console.log(next);
        return Response.success(data, next);
    }
    return null;
}