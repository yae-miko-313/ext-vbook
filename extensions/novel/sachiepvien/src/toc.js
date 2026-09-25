load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    // A post has at most two readable sections: the "Trích đoạn cảnh sắc"
    // accordion and the download button. chap.js tells them apart by the
    // "#download" marker - a fragment, so it never reaches the server.
    let chapters = [];
    doc.select(".wpsm-accordion .wpsm-accordion-trigger").forEach(function (el) {
        chapters.push({
            name: el.text(),
            url: url,
            description: "",
            lock: false,
            pay: false
        });
    });

    if (!doc.select(".priced_block a.btn_offer_block").isEmpty()) {
        chapters.push({
            name: "Link tải file truyện",
            url: url + "#download",
            description: "",
            lock: false,
            pay: false
        });
    }

    if (chapters.length === 0) return Response.error("Truyện này không có trích đoạn hay link tải");
    return Response.success(chapters);
}
