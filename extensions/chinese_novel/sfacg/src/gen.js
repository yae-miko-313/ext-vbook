load('config.js');

function execute(url, page) {
    page = page || "1";
    let fetchUrl = url;

    if (fetchUrl.indexOf("/stag/") !== -1) {
        fetchUrl = fetchUrl.replace(/\/+$/, "") + "/" + page + "/";
    } else {
        let sep = fetchUrl.indexOf("?") === -1 ? "?" : "&";
        fetchUrl = fetchUrl + sep + "PageIndex=" + page;
    }

    let response = httpGet(fetchUrl);
    if (!response.ok) return Response.error("HTTP " + response.status);

    let doc = response.html();
    const data = [];

    let comicLists = doc.select(".list_tabs ul.Comic_Pic_List");
    if (comicLists.isEmpty()) {
        comicLists = doc.select("ul.Comic_Pic_List");
    }

    if (!comicLists.isEmpty()) {
        for (let i = 0; i < comicLists.size(); i++) {
            let e = comicLists.get(i);
            let img = e.select("img").first();
            let titleLink = e.select("strong a").first();
            if (!titleLink) titleLink = e.select("a").first();

            let name = titleLink ? titleLink.text().trim() : (img ? img.attr("alt") : "");
            let link = titleLink ? titleLink.attr("href") : "";
            let cover = img ? img.attr("src") : "";

            let authorEl = e.select("a[id*='AuthorLink'], a[href*='/Club/']").first();
            let desc = authorEl ? authorEl.text().trim() : "";

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
    } else {
        let tagUls = doc.select("ul.TAG_list");
        for (let i = 0; i < tagUls.size(); i++) {
            let ul = tagUls.get(i);
            let img = ul.select("img").first();
            let titleLink = ul.select("strong a").first();
            if (!titleLink) titleLink = ul.select("a").first();

            let name = titleLink ? titleLink.text().trim() : (img ? img.attr("alt") : "");
            let link = titleLink ? titleLink.attr("href") : "";
            let cover = img ? img.attr("src") : "";

            let desc = "";
            let lis = ul.select("li");
            if (lis.size() > 1) {
                let liText = lis.get(1).text();
                let authorMatch = liText.match(/作\s*者[：:]\s*([^\s/]+)/);
                if (authorMatch) {
                    desc = authorMatch[1].trim();
                } else {
                    let catMatch = liText.match(/综合信息[：:]\s*([^/]+)/);
                    if (catMatch) desc = catMatch[1].trim();
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

    let next = "";
    let nextEl = doc.select("li.pagebarNext a");
    if (!nextEl.isEmpty() && nextEl.attr("href")) {
        next = (parseInt(page, 10) + 1).toString();
    } else {
        let flipEl = doc.select(".pagebarFlip a");
        if (!flipEl.isEmpty() && flipEl.text().indexOf("下一页") !== -1) {
            next = (parseInt(page, 10) + 1).toString();
        }
    }

    return Response.success(data, next);
}
