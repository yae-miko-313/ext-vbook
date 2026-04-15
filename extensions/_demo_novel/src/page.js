function execute(url) {
    // page.js: nhận url của detail, trả về mảng URL cho toc.js xử lý
    // ─── Normalize URL ───────────────────────────────────────────────
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    // ─── Kiểm tra phân trang mục lục ─────────────────────────────────
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);

    let doc = response.html();
    let pages = [];

    // TODO: Cập nhật selector phân trang mục lục theo site thực tế
    // Ví dụ: .pagination a, .page-list a, a[href*="trang/"]
    doc.select(".pagination a, .page-list a").forEach(function(el) {
        let href = el.attr("href") + "";
        if (href && !href.includes("#")) {
            if (!href.startsWith("http")) href = BASE_URL + href;
            // Tránh trùng lặp
            if (pages.indexOf(href) === -1) {
                pages.push(href);
            }
        }
    });

    // Nếu không tìm thấy phân trang → trả về [url] để toc.js tự xử lý
    if (pages.length === 0) return Response.success([url]);

    return Response.success(pages);
}
