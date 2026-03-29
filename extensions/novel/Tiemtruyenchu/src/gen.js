function execute(url, page) {
    if(!page) page = '1';
    let response = fetch("https://tiemtruyenchu.com/danh-sach" + url + "&page=" + page);
    if (response.ok) {
        let doc = response.html('utf-8');
        const data = [];
		let table = doc.select("div.story-item")
        table.forEach(e => {
            data.push({
                name: e.select("div.story-content div div.story-header div a").first().text(),
                link: e.select("a").first().attr("href"),
                cover: e.select("a img.story-poster").first().attr("src"),
                description: e.select("div.story-content div div.story-meta span").get(0).text() + " - " + e.select("div.story-content div div.story-meta span").get(2).text(),
                host: "https://tiemtruyenchu.com"
            })
        });
        let next = doc.select("ul.pagination").select("li.page-item.active +li").text()
        return Response.success(data, next)
    }
    return null;
}