load('config.js');

// Generic paginated list loader — dùng cho /type/, /show/
function execute(url, page) {
    url = normalizeUrl(url);
    if (!page) page = '1';

    // Xử lý phân trang
    if (page !== '1') {
        if (url.match(/\/show\//)) {
            url = url.replace(/\/show\/([^\/]+)\/$/, "/show/$1/").replace(/\/show\/(.*?)\/$/, function(match, p1) {
                var baseSlug = p1.replace(/--------\d+---$/, "--------");
                if (baseSlug === p1) {
                    baseSlug = p1.replace(/-----------$/, "--------");
                }
                return "/show/" + baseSlug + page + "---/";
            });
        } else {
            // URL dạng /type/, /page/N
            url = url.replace(/\/page\/\d+\/?$/, "");
            url = url.replace(/\/$/, "") + "/page/" + page + "/";
        }
    }

    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": BASE_URL + "/"
        }
    });
    
    if (!response.ok) {
        return Response.success([]);
    }
    
    var doc = response.html();
    if (!doc) {
        return Response.success([]);
    }
    
    // Dùng parseCards từ config.js
    var list = parseCards(doc);
    var next = getNextPage(doc, page);
    
    // Đảm bảo trả về array ngay cả khi list rỗng
    if (!list || list.length === 0) {
        return Response.success([]);
    }
    
    return Response.success(list, next);
}

