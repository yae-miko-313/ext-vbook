load('config.js');
function execute(url) {
    var doc = Http.get(url).html();
    if (doc) {
        return Response.success({
            name: doc.select('.article-content__title').text(),
            host: BASE_URL,
            author: doc.select('.post-author__name').text(),
            description: doc.select("div.post-meta.d-flex.flex-column.flex-wrap.align-items-sm-end > div.text-muted").html(),
            detail: "",
        });
    }

    return null;
}