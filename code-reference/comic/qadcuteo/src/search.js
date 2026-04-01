load('config.js');
function execute(key, page) {
    if (!page) page = 1;

    let searchUrl = BASE_URL + "/?s=" + key + "&post_type=wp-manga&op=&author=&artist=&release=&adult=";
    if (page > 1) {
        searchUrl += "&paged=" + page;
    }

    let response = fetch(searchUrl);
    if (response.ok) {
        let doc = response.html();
        let data = [];

        doc.select('.c-tabs-item__content').forEach(e => {
            let nameEl = e.select('.post-title h3 a');
            if (nameEl.size() == 0) nameEl = e.select('.post-title a');
            let name = nameEl.text().trim();
            let link = nameEl.attr('href');

            let cover = e.select('.tab-thumb img').attr('src');
            cover = cleanImageUrl(cover);

            let description = '';
            let chapterEl = e.select('.meta-item.latest-chap .chapter a');
            if (chapterEl.size() > 0) {
                description = chapterEl.first().text().trim();
                let postOn = e.select('.meta-item.post-on .font-meta');
                if (postOn.size() > 0) {
                    let timeText = postOn.first().text().trim();
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
    return Response.error("Không thể tìm kiếm");
}