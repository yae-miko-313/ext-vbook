load('config.js');

function execute(input) {
    var json = getJson(input);
    if (!json) return Response.error("Không tải được danh sách");
    var data = [];
    for (var i = 0; i < json.length; i++) {
        data.push(listItem(json[i].tid, json[i].title, json[i].dateline));
    }
    return Response.success(data, "");
}
