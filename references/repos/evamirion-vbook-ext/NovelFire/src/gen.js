load('config.js');

function execute(url, page) {
    if(!page) page = '1';
    let response = fetch(BASE_URL + url + "?page=" +page);
    if (response.ok) {
        let doc = response.html('utf-8');
        const data = [];
		let table = doc.select("ul.novel-list.col6 li a")
        table.forEach(e => {
            data.push({
                name: e.select("h4.novel-title.text2row").first().text(),
                link: e.select("a").first().attr("href"),
                cover: BASE_URL + e.select("figure.novel-cover img").first().attr("data-src"),
                description: e.select("div.novel-stats i").first().text(),
                host: BASE_URL
            })
        });
        let next = doc.select("ul.pagination li a.page-link").attr("href").split("page=")[1]
        return Response.success(data, next)
    }
    return null;
}