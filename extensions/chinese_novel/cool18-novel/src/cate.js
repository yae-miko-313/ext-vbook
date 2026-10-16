load('config.js');

function execute(input, page) {
    if (!page) page = "1";
    var response = fetch(BASE_URL + "/index.php?action=search&act=threadsearch&app=forum&first=1&type=" +
        encodeURIComponent(input) + "&submit=%E6%9F%A5%E8%AF%A2&p=" + page);
    if (!response.ok) return Response.error("HTTP " + response.status);
    return parseThreadList(response.html(), page);
}
