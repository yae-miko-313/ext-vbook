load('config.js');
function execute(url, page) {
    if (!page) page = 1;
    let response = fetch(BASE_URL + url + "?page=" + page, {
        headers: {
            'user-agent': MOBILE_UA,
        }
    })
    if (response.ok) {
        let doc = response.html();
        const data = [];
        doc.select(".txt-list li").forEach(e => {
            data.push({
                name: e.select(".s2 a").text().replace(e.select(".fenleibt").text(), "").trim(),
                cover: "https://i.postimg.cc/T2WtdmBM/5BdXa90.webp",
                link: e.select(".s2 a").attr("href"),
                description: e.select(".s5").text(),
                host: BASE_URL
            })
        });
        let next = doc.select(".pager a:contains(下一页)").size() ? (parseInt(page) + 1).toString() : "";
        return Response.success(data, next)
    }
    return null;
}
