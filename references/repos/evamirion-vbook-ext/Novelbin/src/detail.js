function execute(url) {
    //var url_split=url.slice(0,url.length()-1);
    var doc = Http.get(url).html();
    var el = doc.select(".col-novel-main")
    if (doc) {
        //return Response.success(doc.select(".info-holder").get(0));
        return Response.success({
            name: doc.select("h3.title").get(1).text(),
            cover: doc.select(".col-info-desc .info-holder .books .book img").attr("src"),
            host: "https://novelbin.me",
            description: doc.select(".col-xs-12 .tab-content .tab-pane .desc-text").text() +"<br>",
            author: doc.select(".col-info-desc .desc .info.info-meta li").get(0).select("a").text(),
//            detail: doc.select(".col-info-desc .desc .info.info-meta li").get(1).text() + "<br>"
//			+ doc.select(".col-info-desc .desc .info.info-meta li").get(2).text()  + "<br>"
//                        + doc.select(".col-info-desc .desc .info.info-meta li").get(4).text()

            detail: doc.select(".col-info-desc .desc .info.info-meta li").get(1).text()
            
        });

    }
    return null;
}