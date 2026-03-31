load('config.js')
function execute(url) {
    const doc = fetch(url).html()
    return Response.success({
        name: doc.select("h1").text(),
        cover: decodeURIComponent(doc.select(".gap-y-2 img").attr('src').replace('/_next/image?url=',"").replace('&w=1920&q=75',"")),
        description: doc.select(".text-muted-foreground p").text(),
        author:  doc.select(".space-y-2 .flex:contains(Author) span").last().text(),
        detail: doc.select('.space-y-2 .flex').html().replace(/\n/g,"<br>"),
        ongoing: doc.select(".flex").html().indexOf("Ongoing") != -1,
        host: BASE_URL
    });
}