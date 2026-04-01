load('config.js');
function execute(url, page) {
    if (!page) page = 1;
    let response = fetch(url,{
        method: "GET",
        queries: {
            page : page
        }
    })
    if(response.ok){
        let doc = response.html();
        let elms = doc.select(".grid.grid-cols-3 > a")
        let data = [];
        elms.forEach(e => {
            data.push({
                name: e.select(".thumb-cover + div > span:nth-child(1)").text(),
                link: e.attr("href"),
                cover: e.select(".thumb-cover > img").attr("src"),
                description: [
                    e.select(".tracking-tighter:nth-child(1)").text(),
                    e.select(".tracking-tighter:nth-child(2)").text()
                ].join(" - "),
                host: BASE_URL
            })
        })
        let next = data.length >= 24 ? (++page).toString() : ''
        return Response.success(data, next)
    }
    return null;
}