function execute(url) {
    let response = fetch(url);
    if (response.ok) {
		let chapurl = url + "/chapter-"
        let doc = response.html('utf-8');
        let chapnum = Number(doc.select("div.header-stats span strong").get(0).text()) +1
		
        const data = [];
        for (let i = 1;i < chapnum ; i++) {
            data.push({
                name: "Chapter " + i,
                url: chapurl + i,
                host: "https://novelfire.net"
            })
        }
        return Response.success(data);
    }
    return null;
}