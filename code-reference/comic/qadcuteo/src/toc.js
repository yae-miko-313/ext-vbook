load('config.js');
function execute(url) {
    const match = url.match(/\/manga\/[^\/]+/);
    url = BASE_URL + match[0];
    let response = fetch(url);
    if (response.ok) {
        let data = [];
        let doc = response.html();
        doc.select('[class="page-content-listing single-page"] a').forEach(e => {
            if (e.text()) data.unshift({
                name: e.text().trim(),
                url: e.attr("href"),
                host: BASE_URL
            });
        });
        return Response.success(data);
    }
    return Response.error("Lỗi!!!!!");
}