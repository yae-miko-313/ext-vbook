// Ưu tiên trả về trực tiếp thế này không phải load nhiều
// genre.js — Danh sách thể loại
// Contract: execute() → [{ title, input, script }]
// Cách 1: Trả về trực tiếp (Khuyên dùng vì tốc độ cực nhanh)
/*
function execute() {
    // TODO: Thay URL path phù hợp với site thực tế
    return Response.success([
        { title: "Thể loại 1", input: BASE_URL + "/DUONG_DAN_MOI/{{page}}",    script: "gen.js" },
        { title: "Thể loại 2", input: BASE_URL + "/DUONG_DAN_HOT/{{page}}",    script: "gen.js" },
    ]);
}
// có thể lấy nhanh bằng cách này console.log(Array.prototype.slice.call(document.querySelectorAll('body > div.logo2 > div:nth-child(39) a')).map(function(e) { return '{title: "' + e.innerText + '", input: "' + e.href.replace(/^(?:\\/\\/|[^/]+)*/, '') + '", script: "gen.js"},'; }).join('\n'));
*/

// Cách 2: Gọi request động từ website nguồn
function execute() {
    // TODO: Thay PATH_THELOAI bằng URL trang thể loại thực tế
    var res = fetch(BASE_URL + "/PATH_THELOAI");
    if (!res.ok) return Response.error("Cannot load genres");

    var doc = res.html();
    var genres = [];

    // TODO: Selector các thẻ <a> của từng thể loại
    doc.select("SELECTOR_GENRE_LINKS").forEach(function(el) {
        var title = el.text() + "";
        var href  = (el.attr("href") || "") + "";
        if (!title || !href) return;
        if (!href.startsWith("http")) href = BASE_URL + href;
        genres.push({ title: title, input: href, script: "gen.js" });
    });

    return Response.success(genres);
}
