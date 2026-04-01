load('config.js');
function execute(key, page) {
    if (!page) page = 1;

    let response = fetch(BASE_URL+'/tim-kiem',{
        method: "GET",
        headers: {
            Referer: BASE_URL,
        },
        queries: {
            sort : '-updated_at',
            page : page,
            keyword: key,
        }
    })

    if(response.ok){
        let doc = response.html();
        let el = doc.select(".grid .w-full.relative > .manga-vertical")
        let data = [];
        el.forEach(e => {
            const style_cover = e.select(".cover-frame > .cover").attr("style")
            const url_cover = style_cover.match(/url\('([^']+)'\)/)[1] || ''
            data.push({
                name: e.select("a.text-ellipsis").text(),
                link: BASE_URL + e.select("a.text-ellipsis").attr("href"),
                cover: url_cover,
                description:  e.select("a.text-white").first().text() || 'No chapter',
                host: BASE_URL
            })
        })
        return Response.success(data, (++page).toString())
    }
    return null;
}