function execute(url) {
	//if(!page) page = '1';
    let response = fetch(url);// + "?chapterPage=" + page +"&chapterOrder=asc&communityTab=reviews#danh-sach-chuong");
    if (response.ok) {
        let doc = response.html('utf-8');
        const data = [];
		let table = doc.select("#danh-sach-chuong div div div a")
        table.forEach(e => {
            data.push({
                name: e.select("a").first().text(),
                url: "https://aitruyen.net" + e.select("a").first().attr("href"),
                host: "https://aitruyen.net"
            })
        });
        let next = doc.select("nav div a").last.attr("href")
        return Response.success(data, next)
    }
    return null;
}