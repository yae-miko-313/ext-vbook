load('config.js');

function execute(key, page) {
    if (!page) page = '1';
    // HentaiZ search URL: https://hentaiz.bot/tim-kiem/[keyword]?page=[page]
    let url = BASE_URL + "/tim-kiem/" + key;
    if (page !== '1') {
        url += "?page=" + page;
    }

    let response = fetch(url);
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
