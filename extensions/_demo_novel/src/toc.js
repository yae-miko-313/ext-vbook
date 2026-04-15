function execute(url) {
    // toc.js: nhận url từ page.js (có thể là url detail hoặc url trang mục lục phân trang)
    // Mỗi lần gọi = 1 trang mục lục. App tổng hợp kết quả từ tất cả các call.
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);

    let doc = response.html();
    const chapters = [];

    // TODO: Cập nhật selector danh sách chương theo site thực tế
    // Novel: chapters typically in a list, ordered by oldest→newest or newest→oldest
    doc.select(".chapter-list a, .danh-sach-chuong a, #list-chapter a, .chuong-list a").forEach(function(el) {
        let name = el.text() + "";
        let chapterUrl = el.attr("href") + "";

        if (name && chapterUrl) {
            if (!chapterUrl.startsWith("http")) {
                chapterUrl = chapterUrl.startsWith("/") ? BASE_URL + chapterUrl : BASE_URL + "/" + chapterUrl;
            }

            // Check for VIP/paid chapters
            let isPaid = el.select(".vip, .paid, .lock").size() > 0;

            chapters.push({
                name: name,
                url: chapterUrl,
                host: BASE_URL,
                pay: isPaid || undefined
            });
        }
    });

    if (chapters.length === 0) {
        return Response.error("No chapters found");
    }

    return Response.success(chapters);
}
