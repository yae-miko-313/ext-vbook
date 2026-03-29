load('config.js');

function execute(url, page) {
    if(!page) page = '1';
    let response = fetch(BASE_URL + url + "?p=" +page);
    if (response.ok) {
        let doc = response.html('utf-8');
        const data = [];
		let table = doc.select("div.manga-block.mt-2.mb-3 a")
        table.forEach(e => {
            data.push({
                name: e.select("strong").first().text(),
                link: e.select("a").first().attr("href"),
                cover: e.select("img").first().attr("src"),
//                description: e.select("div.novel-stats i").first().text(),
                host: BASE_URL
            })
        });
        let next = doc.select("div.page-item ul li a").attr("href").split("page=")[1]
        return Response.success(data, next)
    }
    return null;
}