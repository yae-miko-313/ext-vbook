load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var response = fetch(url);
    if (response.ok) {
        var doc = response.html();
        doc.select(".fb-page").remove();

        // Lấy tất cả các thẻ thể loại
        var categoryElements = doc.select(".description .category");
        var isForAdults = false;

        // Duyệt qua từng thể loại và kiểm tra
        for (var i = 0; i < categoryElements.size(); i++) {
            var categoryText = categoryElements.get(i).text().trim();
            if (excludedCategories[categoryText]) {
                isForAdults = true;
                break;
            }
        }

        // Nếu truyện nằm trong danh mục cấm, không trả về thông tin và kết thúc hàm
        if (isForAdults) {
            return null;
        }

        // Tiếp tục xử lý nếu truyện phù hợp
        var author = doc.select("a[href*=/tac-gia/]").first().text();
        var detail = doc.select(".description").last();
        detail.select(".like-buttons").remove();
        return Response.success({
            name: doc.select("title").text().replace(/\s*\|\s*BlogTruyenMoi.Com/, ""),
            cover: doc.select(".thumbnail img").first().attr("src"),
            host: BASE_URL,
            author: author,
            description: doc.select(".detail > .content").html(),
            detail: detail.html(),
            ongoing: doc.select(".description").last().html().indexOf("Đang tiến hành") >= 0
        });
    }
    return null;
}
