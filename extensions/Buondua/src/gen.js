load('config.js');
function execute(url, page) {
    if (!page) page = "0";

    let response = fetch(url, {
        method: "GET",
        queries: {
            start: page
        }
    });
    if (response.ok) {
        let doc = response.html();
        let data = [];
        
        doc.select(".blog.columns > .items-row.column").forEach(e => {
            data.push({
                name: e.select(".item-thumb img").attr("alt"),
                link: BASE_URL +  encodeURIComponent(e.select(".page-header a").first().attr("href")).replace("%2F","/") ,
                cover: e.select(".item-thumb img").attr("src"),
                host: BASE_URL,
            })
        });
        var next = doc.select(".pagination-next").first().attr("href").match(/start=(\d+)/)
        if (next) next = next[1]; else next = '';
        return Response.success(data, next)
    }
    return null;
}