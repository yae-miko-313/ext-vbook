load("config.js");

function execute(url, page) {
    if (!page) page = '1';

    let fetchUrl;
    // Xử lý motip URL: chèn /page/n/ vào giữa domain và query string
    if (page === '1') {
        fetchUrl = url;
    } else {
        if (url.includes('?')) {
            let parts = url.split('?');
            // Xóa dấu gạch chéo ở cuối base path nếu có, rồi chèn /page/n/
            fetchUrl = parts[0].replace(/\/$/, "") + "/page/" + page + "/?" + parts[1];
        } else {
            fetchUrl = url.replace(/\/$/, "") + "/page/" + page + "/";
        }
    }

    let response = fetch(fetchUrl);

    if (response.ok) {
        let doc = response.html();
        let data = [];
        
        // --- TRƯỜNG HỢP 1: Cấu trúc HTML Tab Content (Mới bạn vừa gửi) ---
        let tabElems = doc.select(".tab-content-wrap .c-tabs-item__content");
        if (tabElems.size() > 0) {
            tabElems.forEach(e => {
                let name = e.select(".post-title a").text();
                let link = e.select(".post-title a").attr("href");
                let cover = e.select(".tab-thumb img").attr("src");
                
                // Lấy chương mới nhất từ phần tab-meta
                let lastChap = e.select(".tab-meta .latest-chap a").text();
                let genres = e.select(".mg_genres").text(); // Thể loại

                data.push({
                    name: name,
                    link: link,
                    cover: cover,
                    description: lastChap + (genres ? " | " + genres : ""),
                    host: BASE_URL
                });
            });
        } 
        // --- TRƯỜNG HỢP 2: Cấu trúc HTML Listing cũ (Trang chủ/Mục lục) ---
        else {
            let listElems = doc.select(".page-listing-item .page-item-detail");
            listElems.forEach(e => {
                let name = e.select(".post-title a").text();
                let link = e.select(".post-title a").attr("href");
                let cover = e.select(".item-thumb img").attr("src");
                let lastChap = e.select(".list-chapter .chapter a").text();
                let status = e.select(".trangthai").text();

                data.push({
                    name: name,
                    link: link,
                    cover: cover,
                    description: lastChap + (status ? " | " + status : ""),
                    host: BASE_URL
                });
            });
        }

        // Logic tính trang tiếp theo
        let next = parseInt(page) + 1;
        
        // Kiểm tra xem có trang tiếp theo không dựa vào nút "Trang sau" (madara-pg-n) hoặc madara_goto_page
        // Hoặc đơn giản là nếu không cào được dữ liệu nữa thì dừng
        if (data.length === 0) {
            return Response.success(data, null);
        }

        return Response.success(data, next.toString());
    }
    return null;
}