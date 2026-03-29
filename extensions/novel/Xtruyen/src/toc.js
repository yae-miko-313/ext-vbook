function execute(url) {
    let response = fetch(url);
    if (response.ok) {
		let chapurl = url + "/chuong-"
        let doc = response.html('utf-8');
        let chapnum = Number(doc.select(".summary-content-chapter a").attr("href").split("chuong-")[1].split("/")[0]) + 1;
//        detail = Html.clean(detail, ["p"]);
        const data = [];
        for (let i = 1;i < chapnum ; i++) {
            data.push({
                name: "Chương " + i,
                url: chapurl + i,
                host: "https://xtruyen.vn"
            })
        }
        return Response.success(data);
    }
    return null;
}
