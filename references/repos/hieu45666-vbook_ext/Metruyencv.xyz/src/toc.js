load("config.js");

function execute(url) {
    // Đảm bảo URL kết thúc bằng dấu / để ghép thêm path ajax
    let baseUrl = url.endsWith('/') ? url : url + '/';
    let ajaxUrl = baseUrl + "ajax/chapters/";

    // Gửi request POST không body theo đúng curl bạn cung cấp
    let response = fetch(ajaxUrl, {
        method: "POST",
        headers: {
            "x-requested-with": "XMLHttpRequest",
            "referer": url,
            "accept": "*/*"
        }
    });

    if (response.ok) {
        let doc = response.html();
        let list = [];
        
        // Selector cho Madara Theme
        let rows = doc.select("li.wp-manga-chapter");

        // Web hiển thị chương mới nhất lên đầu, nên ta duyệt ngược 
        // để vBook nhận thứ tự từ Chương 1 đến chương cuối.
        for (let i = rows.size() - 1; i >= 0; i--) {
            let row = rows.get(i);
            let a = row.select("a").first();
            
            if (a) {
                list.push({
                    name: a.text().trim(),
                    url: a.attr("href"),
                    host: BASE_URL
                });
            }
        }

        if (list.length > 0) {
            return Response.success(list);
        }
    }

    return null;
}