load('config.js');

function execute(BASE_URL + url) {
    let response = fetch(BASE_URL + url);
    if (response.ok) {
        let doc = response.html('utf-8');
        let htm = doc.select("div#content").html();
        return Response.success(htm);
    }
    return null;
}