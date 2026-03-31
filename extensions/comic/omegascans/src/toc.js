load('config.js')
function execute(url) {
    const doc = fetch(url).html()
    let allChap = doc.select(".space-y-2 .flex:contains(Total chapters) span").last().text()
    let list = []
    for (let i = 1; i <= allChap; i++) {
        list.push({
            name: `Chap ` + i,
            url: `${url}/chapter-${i}`,
            host: BASE_URL
        })
    }
    return Response.success(list)
}