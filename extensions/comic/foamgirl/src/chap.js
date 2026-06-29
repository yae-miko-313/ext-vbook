load('config.js');
function execute(url) {
    let id = url.match(/(\d+(?:_\d+)?)\.html/)[1]
    let response= fetch(BASE_URL + '/' + id + '.html');
    if (response.ok) {
        let doc = response.html();
        let data = [];
        doc.select("div#image_div > p > a").forEach(e => {
            data.push(e.select("img").attr("src"));
        });

        return Response.success(data);
    }
    return Response.error("Loi khi lay anh");
}