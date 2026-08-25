load("config.js");

function execute(url) {
    // App ghép host + url nên url có dạng "https://gofq.52dns.cc/7228941859807527476"
    // Dùng regex \d{10,} để bỏ qua số ngắn trong domain (52dns.cc)
    var m = String(url).match(/(\d{10,})/);
    var itemId = m ? m[1] : "";
    if (!itemId) {
        return Response.error("ID chương không hợp lệ");
    }

    // Thử lấy nội dung — retry 1 lần nếu 5xx
    var response = fetch(BASE_URL + "/content?item_id=" + itemId, {
        headers: { "User-Agent": BASE_UA },
        timeout: 20000
    });

    // Nếu 5xx thì thử lại 1 lần
    if (response && (response.status >= 500 && response.status < 600)) {
        response = fetch(BASE_URL + "/content?item_id=" + itemId, {
            headers: { "User-Agent": BASE_UA },
            timeout: 20000
        });
    }

    if (!response || !response.ok) {
        var code = response ? response.status : "unknown";
        if (code === 500 || code === 503) {
            return Response.error("Lỗi máy chủ proxy (" + code + "). Chương này có thể bị lỗi tạm thời, thử lại.");
        }
        return Response.error("Lỗi tải chương (HTTP " + code + ")");
    }

    var json = SafeJson(response);
    if (!json || json.code !== 0 || !json.data) {
        return Response.error("Nội dung chương không khả dụng");
    }

    var content = json.data.content || json.data.text || "";
    if (!content) return Response.error("Nội dung chương trống");

    // Parse XHTML <p> tags
    var paragraphs = [];
    var pReg = /<p[^>]*>([\s\S]*?)<\/p>/g;
    var m;
    while ((m = pReg.exec(content)) !== null) {
        var t = m[1]
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .trim();
        if (t) paragraphs.push(decodeText(t));
    }

    if (paragraphs.length === 0) {
        var raw = content.replace(/<[^>]+>/g, "").trim();
        if (raw) paragraphs.push(decodeText(raw));
    }

    if (paragraphs.length === 0) return Response.error("Nội dung rỗng sau xử lý");

    return Response.success(paragraphs.join("<br><br>"));
}
