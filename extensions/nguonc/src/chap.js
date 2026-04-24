load("config.js");

function execute(url) {
    url = normalizeLink(url);
    if (!url) return Response.error("No stream url");

    return Response.success([
        { title: "NguonC", data: url }
    ]);
}
