load('config.js');
load('crypto.js');

// Download buttons point at "/redirect.html?url=<base64 of the real shortlink>".
// Decode it locally so the reader sees a usable url instead of the base64 blob.
function decodeRedirect(href) {
    let match = href.match(/[?&]url=([^&]+)/);
    if (!match) return href;
    try {
        let plain = CryptoJS.enc.Base64.parse(decodeURIComponent(match[1])).toString(CryptoJS.enc.Utf8);
        return plain.indexOf("http") === 0 ? plain : href;
    } catch (error) {
        return href;
    }
}

function execute(url) {
    let isDownload = url.indexOf("#download") !== -1;
    url = normalizeUrl(url.replace("#download", ""));

    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    if (isDownload) {
        let links = doc.select(".priced_block a.btn_offer_block");
        if (links.isEmpty()) return Response.error("Truyện này không có link tải");

        let content = "";
        links.forEach(function (el) {
            let href = el.attr("href");
            if (href.indexOf("http") !== 0) href = BASE_URL + href;
            href = decodeRedirect(href);
            content += "<p>" + el.text().trim() + "</p>";
            content += "<p><a href=\"" + href + "\">" + href + "</a></p>";
        });
        return Response.success(content, "Link tải file truyện");
    }

    let item = doc.select(".wpsm-accordion .wpsm-accordion-item").first();
    if (!item) return Response.error("Truyện này không có trích đoạn");

    return Response.success(item.select(".accordion-content").html(),
        item.select(".wpsm-accordion-trigger").text());
}
