function execute(url, page) {
    if(!page) page = '1';
    let response = fetch("https://tw.linovelib.com" + url + page + ".html");
    if (response.ok) {
        let doc = response.html('utf-8');
        const data = [];
		let table = doc.select("#list_content li.book-li a")
        table.forEach(e => {
            data.push({
                name: e.select("div.book-cell h4").first().text(),
                link: e.select("a").first().attr("href"),
                cover: e.select("div.book-cover img").first().attr("src"),
                description: e.select("p.book-intro").first().text(),
                host: "https://tw.linovelib.com"
            })
        });
        let next = doc.select("#pagelink a.last").attr("href").split(url)[1]
        return Response.success(data, next)
    }
    return null;
}