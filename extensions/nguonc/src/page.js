load("config.js");

function execute(url) {
    if (!url) return Response.error("No url");
    return Response.success([normalizeLink(url)]);
}
