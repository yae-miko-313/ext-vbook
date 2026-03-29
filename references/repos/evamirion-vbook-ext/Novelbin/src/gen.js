function execute(url,page) {
    if(!page) page="1";
    var doc = Http.get(url+page).html();
    var bookList=[];

    if(doc){
        var allBook = doc.select("div.list.list-novel.col-xs-12 div.row");

        var next = doc.select(".pagination.pagination-sm .next a").attr("href").match(/page=(\d+)/);
        if (next) next = next[1];
        for(var i=0; i < allBook.size(); i++){
            var e = allBook.get(i);
            bookList.push({
                name: e.select("h3.novel-title a").attr("title"),
                link: e.select("h3.novel-title a").attr("href"),
                cover: e.select("img.cover").attr("src"),
                description: "Author: " + e.select(".col-xs-7 div .author").text(),
                // +"<br>" + "New chapter: " + doc.select("#list-page .col-truyen-main .list-truyen div.row div.text-info div a").attr("title").match(/Chapter (\d+)/)[1],
                host: "https://novelbin.me"

            });
        }
         
    }
    return Response.success(bookList,next);   

} 