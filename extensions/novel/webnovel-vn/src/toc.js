function execute(url) {
    var res = fetch(url);
    if (!res.ok) return null;
    var html = res.text();
    
    // 1. Phân tích cú pháp lấy ID truyện
    var idMatch = html.match(/story_id\s*=\s*(\d+)/);
    if (!idMatch) return Response.error("Không tìm thấy định danh (ID) của truyện.");
    
    var storyId = idMatch[1];
    var slug = url.split("/").filter(Boolean).pop();
    var listChapters = [];

    // 2. Vòng lặp truy xuất phân trang qua Ajax
    var totalMatch = html.match(/(\d+)\s*chương/);
    var totalChapters = totalMatch ? parseInt(totalMatch) : 3000;
    var totalPages = Math.ceil(totalChapters / 20);
    for (var p = 1; p <= totalPages ; p++) {
        var ajaxRes = fetch("https://webnovel.vn/ajax", {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest" 
            },
            body: "story_id=" + storyId + "&page=" + p + "&slug=" + slug + "&type=list_chapter"
        });

        if (!ajaxRes.ok) break;

        var json = ajaxRes.json();
        if (!json || !json.chap_list) break;

        var doc = Html.parse(json.chap_list);
        var items = doc.select("li.chapter-item");
        
        // Điều kiện dừng nếu hết chương
        if (items.size() === 0) break;

        // 3. Xử lý từng phần tử danh sách
        for (var i = 0; i < items.size(); i++) {
            var item = items.get(i);
            var aTag = item.select("a.chapter-item__link");
            var chapName = "Chương " + ((p-1)*20 + (i+1)).toString() + ": " + item.select(".chapter-item__title").text().trim();
            var chapUrl = aTag.attr("href");

            if (chapName && chapUrl) {
                listChapters.push({
                    name: chapName,
                    url: chapUrl,
                    host: "https://webnovel.vn"
                });
            }
        }
    }

    return Response.success(listChapters);
}
