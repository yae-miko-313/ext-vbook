load('config.js');

function execute(input) {
    var response = fetch(BASE_URL + "/index.php?app=forum&act=" + input);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    var data = [];
    var seen = {};
    // Every list page also repeats the 精华 box on top; the hot page's own list is the table.
    var links = doc.select("table.rank-table td.title-col a");
    if (links.isEmpty()) links = doc.select("ul.post-list li.post-item a");
    links.forEach(function (a) {
        var tid = getTid(a.attr("href"));
        if (!tid || seen[tid]) return;
        seen[tid] = true;
        // Hot list appends "- poster (N bytes) date (N reads)" after the title.
        var text = a.text().replace(/\s+-\s+[^-]*\(\d+ bytes\).*$/, "");
        data.push(listItem(tid, text));
    });
    return Response.success(data, "");
}
