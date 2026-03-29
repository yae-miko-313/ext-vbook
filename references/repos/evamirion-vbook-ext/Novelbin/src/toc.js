function execute(url) {
    var doc = Http.get(url).html();
    if (doc) {
        var list = [];
        var el = doc.select("ul.list-chapter li a");
        for (var i = 0; i < el.size(); i++) {
            var e = el.get(i);
            list.push({
                name: e.attr("title"),
                url: e.attr("href"),
                host: "https://novelbin.me"
            });
        }
        return Response.success(list);
    }
    return null;

}