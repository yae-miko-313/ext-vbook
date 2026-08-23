load('config.js');
function execute(input) {
    let url = input.indexOf("http") === 0 ? normalizeUrl(input) : BASE_URL + input;
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);

    let related = response.html().select("div.related-posts").first();
    if (related === null) return Response.success([], "");

    return Response.success(parseItems(related), "");
}
