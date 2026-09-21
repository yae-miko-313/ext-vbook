load('config.js');

function execute(input, page) {
    if (!page) page = '1';
    let response = fetch(BASE_URL + input + (input.indexOf("?") >= 0 ? "&" : "?") + "page=" + page);
    if (!response.ok) return Response.error(CF_MESSAGE);

    let doc = response.html();
    if (isCloudflare(doc)) return Response.error(CF_MESSAGE);
    return Response.success(parseCards(doc), nextPage(doc, page));
}
