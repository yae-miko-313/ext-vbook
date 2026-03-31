load('config.js');
function execute(url) {
    const match = url.match(/\/manga\/[^\/]+\/[^\/]+/);
    url = BASE_URL + match[0];
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let data = [];

        doc.select('.text-left img').forEach(e => {
            let img = e.attr("src").trim();
            if (img) {
                data.push(img);
            }
        })
        return Response.success(data);
    }
    return null;
}