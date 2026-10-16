let BASE_URL = "https://www.cool18.com/bbs4";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}

function normalizeUrl(url) {
    url = String(url || "").trim();
    var m = url.match(/[?&]tid=(\d+)/);
    if (m) return threadUrl(m[1]);
    if (!/^https?:\/\//i.test(url)) return BASE_URL + "/" + url.replace(/^\/+/, "");
    return url;
}

function threadUrl(tid) {
    return BASE_URL + "/index.php?app=forum&act=threadview&tid=" + tid;
}

function getTid(url) {
    var m = String(url || "").match(/[?&]tid=(\d+)/);
    return m ? m[1] : "";
}

function stripTags(text) {
    return String(text || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// "【书名】（1-3）作者：xxx『都市』" -> { name, author }
function parseSubject(subject) {
    var text = stripTags(subject).replace(/^\.\s*/, "");
    var m = text.match(/【([^】]+)】/);
    var a = text.match(/(?:作者|作|原)\s*[：:]\s*([^\s\[『（(]+)/);
    return { title: text, name: m ? m[1].trim() : text, author: a ? a[1] : "" };
}

function listItem(tid, subject, desc) {
    var s = parseSubject(subject);
    var type = s.title.match(/『([^』]+)』$/);
    return {
        name: s.title.replace(/『[^』]+』$/, ""),
        link: threadUrl(tid),
        cover: "",
        description: (type ? type[1] + " · " : "") + (desc || s.author),
        host: BASE_URL
    };
}

function getJson(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    try {
        return JSON.parse(response.text() + "");
    } catch (e) {
        return null;
    }
}

// Server-rendered thread list (search / type filter): li.l-m1 + a.next pager.
function parseThreadList(doc, page) {
    var data = [];
    doc.select("ul.thread-list li.l-m1").forEach(function (e) {
        var a = e.select("a").first();
        var tid = getTid(a.attr("href"));
        if (!tid) return;
        data.push(listItem(tid, a.text(), e.select("font").text() + " · " + e.select("i").text().trim()));
    });
    var next = doc.select("a.next").isEmpty() ? "" : String(parseInt(page, 10) + 1);
    return Response.success(data, data.length ? next : "");
}

// Poster uid/username only exist in the inline `const threadInfo = {...}` script blob.
function getThreadInfo(html) {
    var m = String(html).match(/threadInfo\s*=\s*(\{[^;]*\});/);
    if (!m) return {};
    try {
        return JSON.parse(m[1]);
    } catch (e) {
        return {};
    }
}
