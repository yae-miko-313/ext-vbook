load("config.js");

function normalizeLink(link) {
    if (!link) return "";
    link = link + "";
    if (link.startsWith("//")) return "https:" + link;
    if (link.startsWith("/")) return BASE_URL + link;
    if (!link.startsWith("http")) return BASE_URL + "/" + link;
    return link;
}

function execute(url) {
    if (!url) return Response.error("No url");
    url = normalizeLink(url);

    return Response.success([
        { name: "Video", url: url, host: BASE_URL }
    ]);
}