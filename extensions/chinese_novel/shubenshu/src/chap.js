load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let m = url.match(/\/([A-Za-z0-9]+)\.html$/);
    let chapId = m ? m[1] : "";

    let content = "";
    let title = "";
    let next = url;
    for (let i = 0; i < 20 && next; i++) {
        let response = fetch(next);
        if (!response.ok) {
            if (i === 0) return Response.error("HTTP " + response.status);
            break;
        }
        let doc = response.html();
        if (i === 0) title = doc.select("h1.bookname").text().replace(/（\d+\/\d+）\s*$/, "");

        let body = doc.select("#booktxt");
        body.select("script, div").remove();
        body.select("p").forEach(function (p) {
            let t = p.text().trim();
            if (t === "本章未完，点击下一页继续阅读。" || t === "(本章完)") p.remove();
        });
        content += body.html();

        // A chapter is split into <id>_2.html, <id>_3.html...; stop once "next" leaves this chapter.
        let nextHref = doc.select("#next").attr("href");
        next = (chapId && nextHref.indexOf("/" + chapId + "_") !== -1) ? absUrl(nextHref) : "";
    }
    return Response.success(content, title);
}
