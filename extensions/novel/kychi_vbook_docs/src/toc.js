function execute(url) {
    var sitemapUrl = "https://vbookapp.gitbook.io/huong-dan-su-dung/sitemap.md";
    var response = fetch(sitemapUrl);
    if (!response.ok) return Response.error("Không thể tải sitemap từ Gitbook");
    
    var text = response.text();
    var data = [];
    var regex = /-\s*\[(.*?)\]\((.*?)\)/g;
    var match;
    var index = 0;
    while ((match = regex.exec(text)) !== null) {
        var title = match[1];
        var path = match[2];
        
        // Extract category from path: /huong-dan-su-dung/category/page.md
        var category = "";
        var parts = path.split('/');
        if (parts.length > 3) {
            var catKey = parts[2].toLowerCase();
            // Category mapping
            var catMap = {
                "giao-dien-app": "App",
                "truyen-chu": "Truyện chữ",
                "truyen-tranh": "Truyện tranh",
                "nguon-mo-rong": "Nguồn",
                "nghe-truyen": "Nghe",
                "ho-tro": "Hỗ trợ",
                "cong-cu": "Công cụ",
                "cai-dat": "Cài đặt"
            };
            category = catMap[catKey] || catKey.charAt(0).toUpperCase() + catKey.slice(1).replace(/-/g, ' ');
            title = category + " - " + title;
        }

        var displayTitle = (index + 1 < 10 ? "0" + (index + 1) : (index + 1)) + ". " + title;
        
        data.push({
            name: displayTitle,
            url: "https://vbookapp.gitbook.io" + path,
            host: "https://vbookapp.gitbook.io"
        });
        index++;
    }

    if (data.length > 0) return Response.success(data);
    return Response.error("Lỗi định dạng Sitemap Gitbook");
}
