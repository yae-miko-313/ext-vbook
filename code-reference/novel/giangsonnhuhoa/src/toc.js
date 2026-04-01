load("config.js");
function clean(t) {
    let s = t.trim();
    s = s.replace(/\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}.*/g, ""); 
    s = s.replace(/^\s*(?:#|\[|“|"|'|‘)?\s*(?:ttty|gsnh|ttyy|gs|tt)\s*(?:\])?\s*\d+[\s\-:–\|]*/i, "");   
    s = s.replace(/^[\s\-:–"”'‘\.\|#\[\]{}()]+/, "").trim();
    return s;
}
function execute(url) {
    let res = fetch(url);
    if (res.ok) {
        let chapters = [];
        let counter = 1;
        
        res.html().select(".chapter-list a, .es-story-link").forEach(e => {
            let href = e.attr("href");
            if (href) {
                if (href.indexOf("http") !== 0) href = BASE_URL + (href.indexOf("/") === 0 ? "" : "/") + href;
                let cName = clean(e.text());
                if (!cName || cName.toLowerCase() === "chương") cName = "Chương " + counter;
                chapters.push({ name: cName, url: href, host: BASE_URL });
                counter++;
            }
        });
        return Response.success(chapters);
    }
    return null;
}