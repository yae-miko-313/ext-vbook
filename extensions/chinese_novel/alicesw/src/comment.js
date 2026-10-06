load('config.js');

function execute(input, next) {
    var response = fetch(input, {
        headers: {
            "user-agent": UserAgent.chrome(),
            "Referer": BASE_URL
        }
    });
    if (!response.ok) return Response.error("Cannot load comments: " + response.status);

    var text = response.text() + "";
    var match = text.match(/var trre=(\[[\s\S]*?\]),page_num=/);
    if (!match) return Response.success([], "");

    var list;
    try {
        list = JSON.parse(match[1]);
    } catch (e) {
        return Response.error("Cannot parse comments");
    }

    var data = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var replies = [];
        collectReplies(item._ || [], replies);
        var comment = buildComment(item);
        comment.replies = replies;
        data.push(comment);
    }
    // Server trả toàn bộ cây trong 1 lần, không phân trang
    return Response.success(data, "");
}

// Làm phẳng các reply lồng nhau thành 1 cấp
function collectReplies(children, out) {
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var reply = buildComment(child);
        if (child.reply_user && child.reply_user.username) {
            reply.name = reply.name + " 回复 " + child.reply_user.username;
        }
        reply.replies = [];
        out.push(reply);
        collectReplies(child._ || [], out);
    }
}

function buildComment(item) {
    var user = item.user || {};
    var avatar = user.headimgurl || "";
    if (avatar && avatar.indexOf("http") !== 0) avatar = BASE_URL + avatar;
    var parts = [formatTime(item.create_time)];
    if (item.up) parts.push("赞: " + item.up);
    return {
        name: user.username || "匿名",
        avatar: avatar,
        content: item.content || "",
        description: parts.join(" · ")
    };
}

function formatTime(ts) {
    if (!ts) return "";
    var d = new Date(ts * 1000);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
        + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function pad(n) {
    return n < 10 ? "0" + n : "" + n;
}
