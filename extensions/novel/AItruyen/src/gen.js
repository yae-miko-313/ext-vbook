function execute(url,page) {
    if(!page) page = '1';
    let response = fetch(url + "&page=" + page);
    if (response.ok) {
        let doc = response.html('utf-8');
        const data = [];
		let table = doc.select(".page-shell .mt-4.grid .grid")
        table.forEach(e => {
            data.push({
                name: e.select("h3").first().text(),
                link: e.select("a").first().attr("href"),
                cover: "https://aitruyen.net" + e.select("img").first().attr("src"),
                description: e.select("p").get(0).text(),
                host: "https://aitruyen.net"
            })
        });
        let next = doc.select("section.page-shell nav a").last().attr("href").split("page=")[1]
        return Response.success(data,next)
    }
    return null;
}
