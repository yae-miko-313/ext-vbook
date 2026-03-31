load('config.js');
function execute(url, page) {
    let status = '2,1' // 1: completed - 2: on going

    if (!page) page = 1;

    if (url.includes('|')) {
        status = url.split('|')[1]
        url = url.split('|')[0]
    }

    let response = fetch(BASE_URL+'/danh-sach',{
        method: "GET",
        headers: {
            Referer: BASE_URL,
        },
        queries: {
            sort : url,
            page : page,
            'filter[status]' : status
        }
    })

    if(response.ok){
        let doc = response.html();
        let el = doc.select(".manga-vertical")
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
        return Response.success(data,(++page).toString())
    }
    return null;
}