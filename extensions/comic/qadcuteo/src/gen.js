load('config.js');
function execute(url, page) {
    if (!page) page = 1;

    let fullUrl = BASE_URL + url;
    if (page > 1) {
        if (fullUrl.includes("?")) {
            fullUrl += "&page=" + page;
        } else {
            if (!fullUrl.endsWith("/")) fullUrl += "/";
            fullUrl += "page/" + page + "/";
        }
    }

    let response = fetch(fullUrl);
    if (response.ok) {
        let doc = response.html();
        let data = [];

        doc.select('.page-item-detail').forEach(e => {
            let nameEl = e.select('.post-title h3 a');
            if (nameEl.size() == 0) nameEl = e.select('.post-title a');
            let name = nameEl.text().trim();
            let link = nameEl.attr('href');

            let cover = e.select('.item-thumb img').attr('src');
            cover = cleanImageUrl(cover);

            let description = '';
            let chapterEl = e.select('.chapter-item .chapter a');
            if (chapterEl.size() > 0) {
                description = chapterEl.first().text().trim();
                let postOn = e.select('.chapter-item .post-on');
                if (postOn.size() > 0) {
                    let timeText = postOn.first().text().trim();
                    if (!timeText) {
                        let timeLink = postOn.first().select('a');
                        if (timeLink.size() > 0) {
                            timeText = timeLink.attr('title');
                        }
                    }
                    if (timeText) {
                        description += ' · ' + timeText;
                    }
                }
            }

            data.push({
                name: name,
                link: link,
                cover: cover,
                description: description,
                host: BASE_URL
            });
        });

        let nextPage = null;
        let navPrev = doc.select('.paging-navigation .nav-previous a');
        if (navPrev.size() > 0) {
            nextPage = (parseInt(page) + 1).toString();
        }

        return Response.success(data, nextPage);
    }
    return Response.error("Không thể tải danh sách truyện");
}