load('config.js');
function execute(url) {
    let response = fetch(BASE_URL + url, {
        headers: {
            'user-agent': MOBILE_UA,
        }
    });
    
    if (response.ok) {
        let doc = response.html();
        const data = [];
        doc.select(".txt-list li").forEach(e => {
            data.push({
                name: e.select(".s2 a").text().replace(e.select(".fenleibt").text(), "").trim(),
                cover: "https://i.postimg.cc/T2WtdmBM/5BdXa90.webp",
                link: e.select(".s2 a").attr("href"),
                description: e.select(".s5").text() + " " + e.select(".five").text(),
                host: BASE_URL
            })
        });
        return Response.success(data)
    }
    return null;
}
