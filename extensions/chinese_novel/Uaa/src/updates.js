load('config.js');

function execute(input, page) {
    var cfMessage = "Mở browser lên mà verify Cloudflare đi bạn ơi";
    if (!page) page = '1';
    let response = fetch(BASE_URL + input + "&page=" + page);
    if (!response || !response.ok) return Response.error(cfMessage);

    let doc= response.html();
    if (doc.select("#cf-error-details, .cf-browser-verification, #challenge-form, #challenge-error-text").size() > 0) {
        return Response.error(cfMessage);
    }

    const data = [];

    doc.select(".main_box .novel_list_box ul li").forEach(e => {
        console.log(e)
        data.push({
            name: e.select(".title").text(),
            link: e.select(".cover_box a").attr('href'),
            cover: e.select(".cover_box a img").attr('src'),
            description: e.select(".info_box a").first().text(),

            host: BASE_URL
        });
    });
    let next = (parseInt(page) + 1).toString();
    return Response.success(data, next);
}
