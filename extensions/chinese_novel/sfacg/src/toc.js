load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    if (url.charAt(url.length - 1) !== "/") url = url + "/";

    let response = httpGet(url + "MainIndex/");
    if (!response.ok) return Response.error("HTTP " + response.status);

    let doc = response.html();
    const data = [];

    let storyCatalogs = doc.select(".story-catalog");
    if (!storyCatalogs.isEmpty()) {
        for (let i = 0; i < storyCatalogs.size(); i++) {
            let cat = storyCatalogs.get(i);
            let volTitle = cat.select(".catalog-title").text().trim();
            if (volTitle) {
                data.push({
                    name: volTitle,
                    type: "section"
                });
            }
            let chList = cat.select(".catalog-list ul li a");
            for (let j = 0; j < chList.size(); j++) {
                let a = chList.get(j);
                let title = a.attr("title");
                if (!title) title = a.text().replace("VIP", "").replace("", "").trim();
                let href = a.attr("href");
                let isVip = href.indexOf("/vip/") !== -1 || !a.select(".icn_vip").isEmpty();
                data.push({
                    name: title,
                    url: absUrl(href),
                    host: BASE_URL,
                    lock: isVip,
                    pay: isVip,
                    type: "chapter"
                });
            }
        }
    } else {
        // Fallback for flat list or mobile layout
        let flatList = doc.select(".catalog-list ul li a");
        if (flatList.isEmpty()) {
            flatList = doc.select("ul.mulu_list a");
        }
        for (let j = 0; j < flatList.size(); j++) {
            let a = flatList.get(j);
            let title = a.attr("title");
            if (!title) title = a.text().replace("VIP", "").replace("", "").trim();
            let href = a.attr("href");
            let isVip = href.indexOf("/vip/") !== -1 || !a.select(".icn_vip").isEmpty();
            data.push({
                name: title,
                url: absUrl(href),
                host: BASE_URL,
                lock: isVip,
                pay: isVip,
                type: "chapter"
            });
        }
    }

    return Response.success(data);
}
