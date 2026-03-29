function execute() {

    var doc = Http.get("https://novelbin.me");

    var genre = [];
    if (doc) {
        var listGenre = doc.select(".dropdown-menu.multi-column ul li a");

        listGenre.forEach(ge => genre.push({
                title: ge.attr("title"),
                input: "https://novelbin.me" + ge.attr("href") + "?page=",
                script: "gen.js"
            }))
        return Response.success(genre);
    }
    return null;
}
// link send gen.js : https://novelbin.me/novelbin-genres/action