load('config.js');

function execute(url) {
    // URL format: {BASE_URL}/content?item_id=...&book_id=...
    var itemIdMatch = url.match(/item_id=([^&]+)/);
    var bookIdMatch = url.match(/book_id=([^&]+)/);

    var itemId = itemIdMatch ? itemIdMatch[1] : null;
    var bookId = bookIdMatch ? bookIdMatch[1] : null;

    if (!itemId || !bookId) {
        return Response.error("Không tìm thấy ID chương hoặc ID truyện trong URL: " + url);
    }

    var body = {
        item_id: itemId,
        book_id: bookId,
        source: "番茄",
        tab: "小说",
        version: '5.3.2',
        html: "",
        variable: JSON.stringify({ custom: "" })
    };

    try {
        var qtCookie = getQtCookie(); // 自动读取 qttoken (如已登录)
        var headers = {
            "Content-Type": "application/json",
            "User-Agent": MOBILE_UA
        };
        if (qtCookie) {
            headers["cookie"] = qtCookie;
        }

        var response = fetch(BASE_URL + "/content", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        if (response.ok) {
            var json = SafeJson(response);
            var content = "";

            if (json && json.content) {
                content = json.content;
            } else if (json && json.data && json.data.content) {
                content = json.data.content;
            }

            if (content) {
                // 检测 content 是否为限流提示，而非正文
                if (content.indexOf('书源版本过低') !== -1
                    || content.indexOf('点击登录') !== -1
                    || content.indexOf('免登录访问次数已达上限') !== -1
                    || content.indexOf('登录后刷新') !== -1) {
                    var guideText = "⚠️ BẠN ĐÃ ĐỌC HẾT 3 CHƯƠNG MIỄN PHÍ HÔM NAY.\n\n"
                        + "1. Mở TRÌNH DUYỆT ngay trong app vBook.\n"
                        + "2. Truy cập địa chỉ: https://v2.czyl.cf/login\n"
                        + "3. ĐĂNG NHẬP tài khoản SÓI XÁM.\n"
                        + "(Hướng dẫn: https://discord.com/channels/607084896288243731/1476830093996327097)\n"
                        + "4. Quay lại app và LÀM MỚI CHƯƠNG để đọc tiếp.";
                    return Response.success(guideText);
                }
                return Response.success(decodeText(content));
            }

            return Response.error("Không tìm thấy nội dung chương.");


        }
        return Response.error("Lỗi HTTP " + response.status + " khi tải nội dung.");
    } catch (e) {
        return Response.error("Lỗi thực thi chap.js: " + e.message);
    }
}
