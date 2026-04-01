function execute(url, page) {
    if(!page) page = '1';
    let response = fetch("https://xtruyen.vn/truyen/?m_orderby=" + url + "&page=" +page);
    if (response.ok) {
        let doc = response.html('utf-8');
        const data = [];
		let table = doc.select("div.popular-item-wrap")
        table.forEach(e => {
            data.push({
                name: e.select("div.popular-content h5 a").first().text(),
                link: e.select("div.popular-content h5 a").first().attr("href"),
                cover: e.select("div.popular-img a img").first().attr("src"),
                description: e.select("div.popular-content div div span.chapter.font-meta.author").first().text(),
                host: "https://xtruyen.vn"
            })
        });
        let next = doc.select("ul.pagination li.page-item ").get(0).select("a").attr("href").split("page=")[1]
        return Response.success(data, next)
    }
    return null;
}