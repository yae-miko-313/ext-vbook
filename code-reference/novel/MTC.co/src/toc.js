function execute(url) {

    // ===== GET HTML =====
    let res = fetch(url);
    if (!res.ok) return null;

    let doc = res.html();

    // ===== LẤY BOOK ID =====
    let cover = doc.select("meta[property=og:image]").attr("content");
    let match = cover.match(/cover\/([a-f0-9]{24})/i);
    if (!match) return null;

    let bookId = match[1];

    // ===== BODY =====
    let body = JSON.stringify([{
        "bookId": bookId,
        "page": 1,
        "limit": 1000,
        "isNewest": false
    }]);

    // ===== CALL API =====
    let api = fetch(url, {
        method: "POST",
        headers: {
            "accept": "text/x-component",
            "content-type": "text/plain;charset=UTF-8",
            // 🔥 next-action dùng cố định
            "next-action": "401b9ba455c4a6d34a47eb6d95d05184eaff298633",
            "referer": url,
            "origin": "https://metruyenchu.co",
            "user-agent": "Mozilla/5.0"
        },
        body: body
    });

    if (!api.ok) return null;

    let text = api.text();

// lấy dòng chứa data
let jsonPart = text.split("\n").find(line => line.startsWith("1:"));
if (!jsonPart) return null;

let raw = JSON.parse(jsonPart.replace(/^1:/, ""));

// 🔥 tìm array thật
let data = null;

if (Array.isArray(raw)) {
    data = raw;
} else if (raw.data && Array.isArray(raw.data)) {
    data = raw.data;
} else if (raw.chapters && Array.isArray(raw.chapters)) {
    data = raw.chapters;
} else {
    // fallback: tìm array đầu tiên
    for (let key in raw) {
        if (Array.isArray(raw[key])) {
            data = raw[key];
            break;
        }
    }
}


if (!data) return null;

let bookSlug = url.split("/truyen/")[1].split("/")[0];

let chapters = [];

data.forEach(item => {
    if (item.slugId && item.name) {
        chapters.push({
            name: item.name,
            url: "https://metruyenchu.co/truyen/" + bookSlug + "/" + item.slugId
        });
    }
});

chapters.reverse();

    chapters.reverse();
    return Response.success(chapters);
}