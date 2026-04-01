load('config.js');
function execute(url, page) {
    if (!page) page = "1";
    url = url.replace(/\/$/, "");
    let response = fetch(BASE_URL + url+'/page/'+page, {
        method: "GET"
    })
    if(response.ok){
        let data = [];
        let doc = response.html();
        doc.select("ul#index_ajax_list > li").forEach(e => {
            data.push({
                name: e.select(".meta-title").text(),
                link: e.select(".meta-title").attr("href").replace(BASE_URL, ''),
                cover: e.select("img").attr('data-original'),
            })
        });
        var next = doc.select(".next.page-numbers").first().attr("href").match(/page\/(\d+)/)
        if (next) next = next[1]; else next = '';
        return Response.success(data, next)
    }
    return Response.error("Something went wrong")
}