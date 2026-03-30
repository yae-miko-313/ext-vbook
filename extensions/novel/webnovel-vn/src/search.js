function execute(key, page) {
    if (!page) page = "1";
    
    // Khởi tạo kết nối với endpoint mục tiêu đã được chứng minh
    var url = "https://webnovel.vn/tim-kiem/?tukhoa=" + encodeURIComponent(key) + "&page=" + page;
    var res = fetch(url);
    if (!res.ok) return Response.error("Trạng thái mạng hoặc máy chủ không ổn định.");
    
    var doc = res.html();
    var data = [];
    var addedLinks = [];
    
    // Tẩy rác DOM cấp 1: Triệt tiêu các khối định tuyến tĩnh không chứa nội dung truyện
    doc.select("footer, header, .footer, .header, nav, script, style").remove();
    
    var allLinks = doc.select("a");
    for (var i = 0; i < allLinks.size(); i++) {
        var a = allLinks.get(i);
        var href = a.attr("href");
        
        // Màng lọc cấu trúc cấp 1: Chặn trang chủ, danh mục và chương lẻ
        if (!href || href === "/" || href === "https://webnovel.vn/" || href.indexOf("/the-loai/") > -1 || href.indexOf("/chuong-") > -1) continue;
        
        // Màng lọc cấu trúc cấp 2: Chặn liên kết ngoại vi và quảng cáo ứng dụng
        if (href.indexOf("play.google") > -1 || href.indexOf("apple.com") > -1 || href.indexOf("bocongthuong") > -1) continue;

        // Vòng lặp chống trùng lặp (Set mô phỏng)
        if (addedLinks.indexOf(href) === -1) {
            var img = a.select("img").first();
            if (img) {
                // Tiền xử lý chuỗi: Chuẩn hóa tiêu đề
                var title = img.attr("alt") || a.text().trim();
                title = title.replace(/Truyện/gi, "").replace(/WebNovel\.vn/gi, "").trim();
                
                // Màng lọc từ khóa rác: Cắt bỏ các thẻ không phải truyện
                var tLower = title.toLowerCase();
                if (tLower.indexOf("đọc online") > -1 || tLower.indexOf("google play") > -1 || tLower.indexOf("bộ công thương") > -1) continue;
                
                var cover = img.attr("data-src") || img.attr("src");
                
                // Trích xuất đối tượng
                if (title && cover && cover.indexOf("logo") === -1) {
                    data.push({
                        name: title, 
                        link: href, 
                        cover: cover, 
                        description: "", 
                        host: "https://webnovel.vn"
                    });
                    addedLinks.push(href);
                }
            }
        }
    }
    
    // Trả về mảng dữ liệu và tính toán phân trang tuyến tính
    return Response.success(data, (parseInt(page) + 1).toString());
}
