function execute(url, page) {
    if(!page) page = '1';
    let response = fetch("https://www.bilinovel.com" + url + page + ".html");
    if (response.ok) {
        let doc = response.html('utf-8');
        const data = [];
		let table = doc.select("ol#list_content li.book-li a")
        table.forEach(e => {
            data.push({
                name: e.select("h4.book-title").first().text(),
                link: "https://www.bilinovel.com" + e.select("a").first().attr("href"),
                cover: e.select("img").first().attr("data-src"),
                description: e.select(".book-intro").first().text(),
                host: "https://www.bilinovel.com"
            })
        });

        return Response.success(data)
    }
    return null;
}