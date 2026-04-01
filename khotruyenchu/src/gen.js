load('config.js');
load('utils.js');

function execute(url, page) {
    if (!page) page = '1';
    
    let fetchUrl = url;
    if (page !== '1') {
        if (fetchUrl.endsWith('/')) fetchUrl = fetchUrl.slice(0, -1);
        fetchUrl += "/page/" + page + "/";
    }

    let response = fetch(fetchUrl);
    if (response.ok) {
        let doc = response.html();
        let novelList = parseNovelList(doc);
        
        let next = "";
        let nextEl = doc.select("a.next.page-numbers").first();
        if (nextEl) {
            next = String(parseInt(page) + 1);
        }

        return Response.success(novelList, next);
    }
    return null;
}
