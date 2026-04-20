load('config.js');

function execute(url, page) {
    if (!page) page = '1';
    let fetchUrl = url;
    if (page !== '1') {
        if (fetchUrl.indexOf('?') > 0) {
            fetchUrl += '&page=' + page;
        } else {
            fetchUrl += '?page=' + page;
        }
    }

    let response = fetch(fetchUrl);
    if (response.ok) {
        let doc = response.html();
        let list = parseCards(doc);
        
        let next = null;
        let pagination = doc.select(".pagination a");
        pagination.forEach(e => {
            if (e.text().includes("Sau") || e.text().includes(">")) {
                next = (parseInt(page) + 1).toString();
            }
        });

        return Response.success(list, next);
    }
    return null;
}
