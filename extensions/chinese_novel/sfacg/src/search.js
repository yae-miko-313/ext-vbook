load('config.js');

function execute(key, page) {
    page = page || "1";
    if (page !== "1") {
        return Response.success([], "");
    }

    let response = httpGet("https://s.sfacg.com/?Key=" + encodeURIComponent(key) + "&S=1&SS=0");
    if (!response.ok) return Response.error("HTTP " + response.status);

    let doc = response.html();
    const data = [];

    let tables = doc.select("table.comic_cover");
    if (!tables.isEmpty()) {
        let uls = tables.last().select("ul");
        for (let i = 0; i < uls.size(); i++) {
            let e = uls.get(i);
            let img = e.select("img").first();
            let a = e.select("strong a").first();
            if (!a) a = e.select("a").first();

            let name = a ? a.text().trim() : (img ? img.attr("alt") : "");
            let link = a ? a.attr("href") : "";
            let cover = img ? img.attr("src") : "";
            let desc = "";

            let lis = e.select("li");
            if (lis.size() > 1) {
                let liText = lis.get(1).text().trim();
                if (liText.indexOf("综合信息：") !== -1) {
                    let parts = liText.split("综合信息：")[1].split("/");
                    if (parts.length > 0) desc = parts[0].trim();
                } else {
                    desc = liText;
                }
            }

            if (name && link) {
                data.push({
                    name: name,
                    link: link,
                    cover: absUrl(cover),
                    description: desc,
                    host: BASE_URL
                });
            }
        }
    }

    return Response.success(data, "");
}
