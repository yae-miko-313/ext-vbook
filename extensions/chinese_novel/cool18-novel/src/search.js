load('config.js');

function execute(key, page) {
    if (!page) page = "1";
    var response = fetch(BASE_URL + "/index.php?action=search&bbsdr=bbs4&act=threadsearch&app=forum&first=1&keywords=" +
        encodeURIComponent(key) + "&submit=%E6%9F%A5%E8%AF%A2&p=" + page);
    if (!response.ok) return Response.error("HTTP " + response.status);
    return parseThreadList(response.html(), page);
}
