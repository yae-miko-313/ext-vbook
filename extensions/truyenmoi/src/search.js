function execute(key, page) {
    if (!page) page = '1';

    if (!key || !String(key).trim()) {
        return Response.success([], null);
    }

    let query = encodeURIComponent(String(key).trim());
    let url = "https://truyenmoikk.com/tim-kiem/?tukhoa=" + query;
    if (page !== '1') {
        url = "https://truyenmoikk.com/tim-kiem/trang-" + page + "?tukhoa=" + query;
    }

    let response = fetch(url);
    
    if (response.ok) {
        let doc = response.html();
        let data = [];

        let items = doc.select(".list-truyen .row[itemscope]");
        if (items.size() === 0) items = doc.select(".list-truyen .row");
        items.forEach(e => {
            let a = e.select(".truyen-title a").first();
            if (!a) return;

            let link = a.attr("href");
            if (link && link.indexOf("http") !== 0) {
                if (link.charAt(0) === "/") link = "https://truyenmoikk.com" + link;
                else link = "https://truyenmoikk.com/" + link;
            }

            data.push({
                name: a.text().trim(),
                link: link,
                cover: e.select("img").attr("src"),
                description: e.select(".author").text().trim(),
                host: "https://truyenmoikk.com"
            });
        });

        let next = "";
        let nextHref = doc.select(".pagination li.active + li a").attr("href");
        if (nextHref) {
            let match = nextHref.match(/trang-(\d+)/);
            if (match) next = match[1];
        }

        return Response.success(data, next);
    }
    return null;
}