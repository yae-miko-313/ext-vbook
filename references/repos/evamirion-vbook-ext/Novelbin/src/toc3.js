function execute(url) {

    var docID = Http.get(url).html();
    var idBook = docID.select("#truyen-id").attr("value");
    //Console.log(idBook)
    var doc = Http.get("https://novelfull.com/ajax-chapter-option?novelId=" + idBook).html();
    var list_chapter =[];
    var all_chapter = doc.select(".panel-body")
    // for(var i in all_chapter){
    //     var e = all_chapter[i];
    //     //Console.log(e);
    //     list_chapter.push({
    //         name: e.text(),
    //         url: e.attr("value"),
    //         host: "https://novelbin.me"
    //     })
    // }
    all_chapter.forEach(e=>list_chapter.push({
            name: e.text(),
            url: e.attr("value"),
            host: "https://novelbin.me"
        }))
    return Response.success(list_chapter);
}
//https://novelbin.me/novel-book/shadow-slave/chapter-1-nightmare-begins
// toc json.