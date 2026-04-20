const BASE_URL = 'https://hentaiz.bot';

function normalizeUrl(url) {
    if (!url) return '';
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return BASE_URL + url;
    return url;
}

function parseCards(doc, selector) {
    if (!selector) selector = ".item-box, .video-box";
    let list = [];
    doc.select(selector).forEach(e => {
        let title = e.select("h3").text();
        let link = e.select("a").first().attr("href");
        let cover = e.select("img").attr("src") || e.select("img").attr("data-src");
        let episode = e.select(".video-box__episode, .image-box__poster__episode").text();

        list.push({
            name: title,
            link: normalizeUrl(link),
            cover: normalizeUrl(cover),
            description: episode,
            host: BASE_URL
        });
    });
    return list;
}
