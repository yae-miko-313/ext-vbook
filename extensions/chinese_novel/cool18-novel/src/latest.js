load('config.js');

// The forum index renders its list client-side from this JSON; the next page is
// requested with mtid = smallest tid among the top-level threads already shown.
function execute(input, page) {
    var mtid = page || input || "0";
    var json = getJson(BASE_URL + "/index.php?app=forum&act=ajax&mtid=" + mtid + "&aifilter=0");
    if (!json) return Response.error("Không tải được danh sách");

    var data = [];
    var min = 0;
    for (var i = 0; i < json.length; i++) {
        var item = json[i];
        if (item.uptid !== "0") continue;
        data.push(listItem(item.tid, item.subject, item.username + " · " + item.dateline));
        var tid = parseInt(item.tid, 10);
        if (!min || tid < min) min = tid;
    }
    return Response.success(data, min ? String(min) : "");
}
