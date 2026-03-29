function execute(url, page) {
    if (!page) page = '1';
    
    let targetUrl = url;
    if (page !== '1') {
        targetUrl += (targetUrl.includes('?') ? '&' : '?') + "page=" + page;
    }

    let response = fetch(targetUrl, {
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        let doc = response.html();
        let listBook = [];

        // 1. Nhận diện Giao diện Thể loại/Website (Dạng Card - Code bạn vừa gửi)
        // Cấu trúc: Mỗi truyện là một thẻ <a> chứa div class "thumb-cover"
        let cardItems = doc.select("a:has(.thumb-cover)");
        
        // 2. Nhận diện Giao diện Trang chủ/Mới cập nhật (Dạng Row - Code cũ)
        let rowItems = doc.select("div.border-b-\\[\\#312f40\\]");

        if (cardItems.length > 0 && cardItems.select(".col-span-9").length === 0) {
            // XỬ LÝ GIAO DIỆN THỂ LOẠI (CARD)
            cardItems.forEach(item => {
                let title = item.select("span.font-bold.line-clamp-2").text();
                let link = item.attr("href");
                let cover = item.select("img").first().attr("src");
                // Lấy chương mới nhất (thường là thẻ span thứ 2 trong khối text)
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
            // XỬ LÝ GIAO DIỆN DÒNG (ROW)
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

        // TÍNH TOÁN PHÂN TRANG
        let next = null;
        if (listBook.length >= 12) { // Ngưỡng tối thiểu để có trang tiếp theo
            next = (parseInt(page) + 1).toString();
        }

        // Kiểm tra nút chuyển trang thực tế trong HTML
        let pagination = doc.select(".pagination");
        if (pagination.length > 0) {
            let hasNextPage = pagination.select("li.active + li:not(.disabled)").length > 0;
            if (!hasNextPage) next = null;
        }

        return Response.success(listBook, next);
    }

    return null;
}