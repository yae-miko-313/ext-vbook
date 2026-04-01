function execute(key, page) {
    if (!page) page = '1';

    // Tạo URL tìm kiếm dựa trên cấu trúc bạn cung cấp
    // genres: để trống, status: all (hoặc Hoàn thành tùy bạn), name: từ khóa
    let targetUrl = "https://www.zettruyen.africa/tim-kiem-nang-cao?genres=&status=all&type=all&sort=latest&chapterRange=all&name=" + encodeURIComponent(key);
    
    if (page !== '1') {
        targetUrl += "&page=" + page;
    }

    let response = fetch(targetUrl, {
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        let doc = response.html();
        let listBook = [];

        // 1. Kiểm tra Giao diện Thể loại/Tìm kiếm (Dạng Card dọc)
        let cardItems = doc.select("a:has(.thumb-cover)");
        
        // 2. Kiểm tra Giao diện Dòng ngang (Nếu có)
        let rowItems = doc.select("div.border-b-\\[\\#312f40\\]");

        if (cardItems.length > 0 && cardItems.select(".col-span-9").length === 0) {
            // XỬ LÝ DẠNG CARD (Thường dùng cho Search)
            cardItems.forEach(item => {
                let title = item.select("span.font-bold").text().trim();
                let link = item.attr("href");
                let cover = item.select("img").first().attr("src");
                let lastChapter = item.select("span.text-txt-secondary").first().text().trim();

                if (title && link) {
                    listBook.push({
                        name: title,
                        link: link,
                        cover: cover,
                        description: lastChapter,
                        host: "https://www.zettruyen.africa"
                    });
                }
            });
        } else {
            // XỬ LÝ DẠNG DÒNG (Fallback)
            rowItems.forEach(item => {
                let titleElement = item.select(".col-span-9 div a").first();
                let title = titleElement.text().trim();
                let link = titleElement.attr("href");
                let cover = item.select(".thumb-cover img").first().attr("src");
                let lastChapter = item.select(".chapter-link p").first().text().trim();

                if (title && link) {
                    listBook.push({
                        name: title,
                        link: link,
                        cover: cover,
                        description: lastChapter,
                        host: "https://www.zettruyen.africa"
                    });
                }
            });
        }

        // Tính toán phân trang
        let next = null;
        let pagination = doc.select(".pagination");
        if (pagination.length > 0) {
            let hasNextPage = pagination.select("li.active + li:not(.disabled)").length > 0;
            if (hasNextPage) {
                next = (parseInt(page) + 1).toString();
            }
        } else if (listBook.length >= 12) {
            next = (parseInt(page) + 1).toString();
        }

        return Response.success(listBook, next);
    }

    return null;
}