function execute(url) {
    url = url.replace(/\/$/, "");
    let response = fetch(url);
    if (!response.ok) return null;

    let doc = response.html();
    let chapters = [];

    // Lấy chương trang đầu
    let items = doc.select(".list-chapter li a");
    for (let i = 0; i < items.size(); i++) {
        let e = items.get(i);
        chapters.push({
            name: e.text().trim(),
            url: e.attr("href"),
            host: "https://truyenmoiyy.com"
        });
    }

    // Lấy max trang
    let maxPage = 1;
    let pages = doc.select(".pagination li a");
    for (let i = 0; i < pages.size(); i++) {
        let pageUrl = pages.get(i).attr("href");
        let match = pageUrl.match(/trang-(\d+)/);
        if (match) {
            let pageNum = parseInt(match[1]);
            if (pageNum > maxPage) maxPage = pageNum;
        }
    }

    // Load ngầm các trang tiếp theo
    if (maxPage > 1) {
        for (let i = 2; i <= maxPage; i++) {
            let pageUrl = url + "/trang-" + i + "/";
            let pageResponse = fetch(pageUrl);
            if (pageResponse.ok) {
                let pageDoc = pageResponse.html();
                let pageItems = pageDoc.select(".list-chapter li a");
                for (let j = 0; j < pageItems.size(); j++) {
                    let e = pageItems.get(j);
                    chapters.push({
                        name: e.text().trim(),
                        url: e.attr("href"),
                        host: "https://truyenmoiyy.com"
                    });
                }
            }
        }
    }

    return Response.success(chapters);
}