load('config.js');

// Follow-ups by other users, nested by uptid. Only subjects are listed: the
// reply bodies would need one request per post.
function execute(input) {
    var tid = String(input);
    var json = getJson(BASE_URL + "/index.php?app=forum&act=achildlist&tid=" + tid);
    if (!json) return Response.error("Không tải được bình luận");

    var response = fetch(threadUrl(tid));
    var info = response.ok ? getThreadInfo(response.text() + "") : {};

    var byParent = {};
    for (var i = 0; i < json.length; i++) {
        var item = json[i];
        if (item.uptid === tid && String(item.uid) === String(info.uid) && parseInt(item.size, 10) > 0) continue;
        (byParent[item.uptid] = byParent[item.uptid] || []).push(item);
    }
    return Response.success(build(byParent, tid), "");
}

function build(byParent, parent) {
    var list = byParent[parent] || [];
    var data = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        data.push({
            name: item.username,
            content: stripTags(item.subject),
            description: item.dateline + (parseInt(item.size, 10) > 0 ? " · " + item.size + " bytes" : ""),
            replies: build(byParent, item.tid)
        });
    }
    return data;
}
