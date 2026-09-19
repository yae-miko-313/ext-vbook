load('config.js');
function execute() {
    let response = fetch(BASE_URL + "/");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let hotItems = [];
    doc.select("#hotcontent .l .item").forEach(function (el) {
        let a = el.select("dt a").first();
        if (!a) return;
        hotItems.push({
            name: a.text(),
            link: a.attr("href"),
            cover: absUrl(el.select(".image img").attr("data-original")),
            description: el.select("dd").text(),
            host: BASE_URL
        });
    });

    let rankItems = [];
    doc.select("#hotcontent .r li").forEach(function (el) {
        let a = el.select(".s2 a").first();
        if (!a) return;
        rankItems.push({
            name: a.text(),
            link: a.attr("href"),
            cover: coverOf(a.attr("href")),
            description: el.select(".s5").text(),
            tag: el.select(".s1").text(),
            host: BASE_URL
        });
    });

    let sections = [
        { id: "hot", title: "热门小说推荐", subtitle: "", type: "grid", items: hotItems },
        { id: "rank", title: "人氣小說榜", subtitle: "", type: "ranking", items: rankItems }
    ];

    doc.select(".novelslist .content").forEach(function (block, idx) {
        let head = block.select("h2 a").first();
        if (!head) return;
        let items = [];
        block.select("li").forEach(function (li) {
            let a = li.select("a").first();
            if (!a) return;
            items.push({
                name: a.text(),
                link: a.attr("href"),
                cover: coverOf(a.attr("href")),
                description: li.select("i").text(),
                host: BASE_URL
            });
        });
        sections.push({
            id: "cat" + idx,
            title: head.text(),
            subtitle: "",
            type: "grid",
            items: items,
            action: { type: "list", script: "search.js", input: head.attr("href"), data: "" }
        });
    });

    return Response.success(sections);
}
