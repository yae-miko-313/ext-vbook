function execute() {
    var res = fetch("https://novelfire.net/genre-all/sort-new/status-all/all-novel");
    if (!res.ok) return null;
    var doc = res.html();
    var data = [];
    doc.select("ul.action-list li a").forEach(function(e) {
        data.push({title: e.text().trim(), input: e.attr("href"), script: "gen.js"});
    });
    return Response.success(data);
}