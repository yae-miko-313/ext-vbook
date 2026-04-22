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
    if (!url) return Response.error("No track");
    url = normalizeLink(url);

    if (url.indexOf(".mp4") > -1 || url.indexOf(".m3u8") > -1 || url.indexOf(".m3u9") > -1) {
        return Response.success({
            data: url,
            type: "native",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                "Referer": BASE_URL + "/"
            },
            host: BASE_URL,
            timeSkip: []
        });
    }

    return Response.success({
        data: url,
        type: "auto",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
            "Referer": BASE_URL + "/"
        },
        host: BASE_URL,
        timeSkip: []
    });
}