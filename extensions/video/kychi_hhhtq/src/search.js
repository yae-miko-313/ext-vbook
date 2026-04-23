load('config.js');

// Search — URL: /?s={key} hoặc /vodsearch/?wd={key}
function execute(key, page) {
    if (!page) page = '1';

    var response = fetch(BASE_URL + "/", {
        queries: {
            s: key
        },
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
    if (!list || list.length === 0) {
        return Response.success([]);
    }
    
    return Response.success(list);
}

