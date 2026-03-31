load('config.js');

function execute(url) {
    let response = fetch(url);
    if (!response.ok) return null;

    let doc = response.html();
    let title = doc.select(".article-content__title").first().text();

    const data = [];
    data.push({
        name: title,
        url: url,
        host: BASE_URL
    });

    return Response.success(data);
}
