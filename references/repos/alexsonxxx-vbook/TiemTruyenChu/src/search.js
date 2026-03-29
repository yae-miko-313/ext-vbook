function execute(key) {

    load('config.js');

    if (!key) return Response.success([]);

    key = key.replace(/\s+/g, " ").trim();

    let keyword = encodeURIComponent(key).replace(/%20/g, "+");

    let url = BASE_URL + "/danh-sach?keyword=" + keyword + "&ajax=1";

    let res = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": BASE_URL
        }
    });

    if (!res || !res.ok) return Response.success([]);

    let json;
    try {
        json = res.json();
    } catch (e) {
        return Response.success([]);
    }

    let list = [];

    if (!json || !json.stories) return Response.success(list);

    json.stories.forEach(item => {

        let link = BASE_URL + "/truyen/" + item.id;

        let cover = item.poster || "";
        if (cover.startsWith("/")) {
            cover = BASE_URL + cover;
        }

        let desc = item.author || "";

        list.push({
            name: item.title,
            link: link,
            cover: cover,
            description: desc,
            host: BASE_URL
        });
    });

    return Response.success(list);
}
