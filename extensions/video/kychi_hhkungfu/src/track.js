load("config.js");

function execute(input) {
    var data = {};
    try {
        data = JSON.parse(input);
    } catch (e) {
        return Response.error("Invalid input format");
    }

    var embedUrl = data.embedUrl;
    var watchUrl = data.url;

    if (!embedUrl) {
        return Response.error("Cannot extract embed URL");
    }

    var pageReferer = watchUrl || (BASE_URL + "/");

    return Response.success({
        data: embedUrl,
        type: "auto",
        headers: {
            "Referer": pageReferer,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        host: BASE_URL
    });
}