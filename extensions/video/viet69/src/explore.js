load('config.js');
function execute() {
    let response = fetch(BASE_URL);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let latest = doc.select("div.loop-content").first();
    let member = doc.select("div.app-cv-section").first();

    let genreItems = [];
    doc.select("#main-nav ul.menu > li > a").forEach(function (el) {
        let href = el.attr("href");
        if (!href || href.indexOf("lienhe") !== -1) return;
        genreItems.push({
            name: el.text().trim(),
            cover: "",
            link: "",
            action: { type: "list", script: "search.js", input: href, data: "" }
        });
    });

    let sections = [
        {
            id: "latest",
            title: "Mới nhất",
            subtitle: "Video vừa cập nhật",
            type: "grid",
            shape: "movie",
            items: latest === null ? [] : parseItems(latest),
            action: { type: "list", script: "search.js", input: "/", data: "" }
        },
        {
            id: "genres",
            title: "Thể loại",
            subtitle: "",
            type: "chip",
            items: genreItems
        }
    ];

    if (member !== null) {
        sections.splice(1, 0, {
            id: "member",
            title: "Video của thành viên",
            subtitle: "Do thành viên chia sẻ",
            type: "horizontal_list",
            shape: "movie",
            items: parseItems(member),
            action: { type: "list", script: "search.js", input: "/bai-viet/", data: "" }
        });
    }

    return Response.success(sections);
}
