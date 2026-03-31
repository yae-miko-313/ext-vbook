load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let doc = fetch(url).html();
    let el = doc.select(".scrollbar-thumb-theme-color .chapter-items > a")
    const data = [];
    el.forEach(e => {
        data.push({
            name: e.select(".text-sm").text() + " - " + e.select("p.text-xs").text(),
            url: e.attr("href"),
            host: BASE_URL
        })
    })
    return Response.success(data.reverse());
}