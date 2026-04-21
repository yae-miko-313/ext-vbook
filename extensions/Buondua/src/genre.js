load('config.js');
const collectionUrl = BASE_URL + '/collection'
function execute() {
    let response = fetch(collectionUrl, {
        method: "GET"
    })
    if (response.ok) {
        let doc = response.html();
        let data = [];
        doc.select(".blog.collection > .collection-item").forEach(e => {
            data.push({
                title: e.select(".item-link > span").first().text(),
                input: BASE_URL +  encodeURIComponent(e.select(".item-link").first().attr("href")).replace("%2F","/"), 
                script: "gen.js"
            })
        });
        return Response.success(data);
    }
    return Response.error("Loi gi do?")
}