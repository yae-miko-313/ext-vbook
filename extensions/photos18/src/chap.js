load('config.js');
function execute(url) {
    id = url.match(/v\/(.+)/)[1]
    let response= fetch(BASE_URL + "/v/" + id);
    if (response.ok) {
        let doc = response.html();
        let data = [];
        doc.select('#content img').forEach(img => {
            data.push(img.attr('src'))
        })
        return Response.success(data);
    }
    return Response.error("Loi khi lay anh");
}