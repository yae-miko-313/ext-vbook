function execute(url) {
    let res = fetch(url);
    if (!res.ok) return null;
    let doc = res.html();

    // 1. Cô lập vùng nội dung đa lớp (Multi-Selectors)
    let contentEl = doc.select("article.reader__content").first();
    if (!contentEl) return Response.error("Nội dung chương đang được cập nhật hoặc gặp lỗi cấu trúc website.");

    // 2. Tẩy rác DOM cấp 1
    contentEl.select("div[class*='appmobile'], div[class*='reader__actions'], .ads, script, style, .hidden, .author-area, .chap-footer, iframe").remove();

    let htmlContent = contentEl.html();

    // 3. Dàn trang in ấn (Typography)
    let text = htmlContent
        .replace(/<p[^>]*>/gi, "")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/&nbsp;/g, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();

    // 4. Tẩy rác Keyword cấp 2 (Cắt đứt đuôi rác)
    text = text.replace(/(Tải App để đọc tiếp|Mời bạn tải app WebNovel|Bạn đang đọc truyện trên)[\s\S]*/gi, "");
    text = text.replace(/(©|CÔNG TY|Vietnamese publication rights arranged|Zhiyuan Yuedu)[\s\S]*/gi, "");
    text = text.replace(/\n/g, "<br>").trim();
    
    // 5. Kết xuất (Render mượt mà trên Vbook)
    return Response.success(text);
}
