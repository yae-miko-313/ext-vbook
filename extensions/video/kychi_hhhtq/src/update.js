load('config.js');

// Load danh sách phim mới cập nhật — URL: /show/1-----------/
// Phân trang: /show/1--------{N}---/  (VD: trang 2 = /show/1--------2---/)
function execute(url, page) {
    url = normalizeUrl(url);
    if (!page) page = '1';

    if (page !== '1') {
        // URL gốc: /show/1-----------/
        // Trang N:  /show/1--------N---/
        url = url.replace(/\/show\/([^\/]+)\/$/, "/show/$1/").replace(/\/show\/(.*?)\/$/, function(match, p1) {
            // Thay phần cuối của slug bằng page number
            var baseSlug = p1.replace(/--------\d+---$/, "--------");
            if (baseSlug === p1) {
                // Slug chưa có page, thêm vào
                baseSlug = p1.replace(/-----------$/, "--------");
            }
            return "/show/" + baseSlug + page + "---/";
        });
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
    
    var list = parseCards(doc);
    var next = getNextPage(doc, page);
    
    if (!list || list.length === 0) {
        return Response.success([]);
    }
    
    return Response.success(list, next);
}

