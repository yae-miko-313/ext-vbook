function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('utf-8');
        let htm = doc.select("h2.text-center.fw-bold.mt-4.mb-3.text-success").html() + "</br>" + doc.select(".chapter-content").html();
        return Response.success(htm);
    }
    return null;
}