load("config.js");

function execute(url) {
    url = normalizeHost(url);
    return Response.success([
        { name: "Watch now", url: url, host: BASE_URL }
    ]);
}