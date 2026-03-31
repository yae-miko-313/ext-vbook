load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url)
    if(response.ok) {
        let doc = response.html()
        
        let genres = [];
        doc.select(".px-4 > .space-y-1.pt-4 .flex > a").forEach(e => {
            genres.push({
                title: e.text().trim(),
                input: e.attr('href'),
                script: "cat.js"
            });
        });
        let infoElm = doc.select('.grid.grid-cols-1.gap-2.mt-0 > .flex')
        let info = []
        infoElm.forEach(elm => {
            let content = `${elm.select(".whitespace-nowrap").text()}: ${elm.select(".text-sm:not(.whitespace-nowrap)").text()}`
            info.push(content)
        })

        return Response.success({
            name: doc.select("h1").first().text(),
            cover: doc.select(".thumb-cover > img[alt='poster']").attr("src"),
            author: doc.select(".grid.grid-cols-1.gap-2.mt-0 > .flex:nth-child(1) > p").last().text(),
            description: doc.select(".comic-content").text(),
            detail: info.join('<br>'),
            ongoing: doc.select(".grid.grid-cols-1.gap-2.mt-0 > .flex").last().text().includes('Đang ra'),
            genres: genres,
            host: BASE_URL,
            suggests: [
                {
                    title: "Có thể bạn thích",
                    input: doc.select(".flex-wrap.flex.bg-\\[\\#222222\\].p-\\[10px\\]"),
                    script: "suggests.js"
                }
            ]
        });
    }
}