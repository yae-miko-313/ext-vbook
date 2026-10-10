load('config.js');

function execute(url, page) {
    if (!page) page = '1';
    
    var fetchUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + "page=" + page;
    
    var response = fetch(fetchUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://phim.nguonc.com/"
        }
    });

    if (response.ok) {
        var json = response.json();
        var list = parseCards(json);
        
        var next = null;
        // Kiểm tra paginate bọc trong data hoặc ở root
        var paginate = json.paginate || (json.data && json.data.paginate);
        if (paginate) {
            var currentPage = parseInt(paginate.current_page || page);
            var totalPages = parseInt(paginate.total_page || paginate.last_page || 0);
            if (currentPage < totalPages) {
                next = (currentPage + 1).toString();
            }
        }
        
        return Response.success(list, next);
    }
    
    return Response.success([]);
}
