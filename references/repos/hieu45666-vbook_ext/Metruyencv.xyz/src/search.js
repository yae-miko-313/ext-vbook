load("config.js");

function execute(key, page) {
    if (!page) page = '1';

    let fetchUrl;
    // Cấu trúc: domain + /page/n/ + ?s=key&post_type=wp-manga
    if (page === '1') {
        fetchUrl = BASE_URL + "/?s=" + encodeURIComponent(key) + "&post_type=wp-manga";
    } else {
        fetchUrl = BASE_URL + "/page/" + page + "/?s=" + encodeURIComponent(key) + "&post_type=wp-manga";
    }

    let response = fetch(fetchUrl);

    if (response.ok) {
        let doc = response.html();
        let data = [];
        
        // Sử dụng selector của giao diện tìm kiếm/lọc (Tab Content)
        let elems = doc.select(".tab-content-wrap .c-tabs-item__content");
        
        elems.forEach(e => {
            let titleAnchor = e.select(".post-title a");
            let name = titleAnchor.text();
            let link = titleAnchor.attr("href");
            let cover = e.select(".tab-thumb img").attr("src");
            
            // Lấy chương mới nhất và thể loại để hiển thị ở dòng mô tả
            let lastChap = e.select(".tab-meta .latest-chap a").text();
            let genres = e.select(".mg_genres").text();

            data.push({
                name: name,
                link: link,
                cover: cover,
                description: lastChap + (genres ? " | Thể loại: " + genres : ""),
                host: BASE_URL
            });
        });

        // Tính toán trang tiếp theo
        let next = parseInt(page) + 1;
        
        // Kiểm tra điều kiện dừng: Nếu không tìm thấy kết quả nào ở trang hiện tại
        if (data.length === 0) {
            return Response.success(data, null);
        }

        return Response.success(data, next.toString());
    }
    return null;
}