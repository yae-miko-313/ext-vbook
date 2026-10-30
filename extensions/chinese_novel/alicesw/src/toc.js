load('config.js');
function execute(url) {
    url = url.replace('/novel/', '/other/chapters/id/')
    let response = fetch(url, {
        headers: {
            "user-agent": MOBILE_UA
        }
    });
    if (response.ok) {
        let doc = response.html();
        let el = doc.select(".section-list li a")
        const data = [];
        for (let i = 0; i < el.size(); i++) {
            var e = el.get(i);
            data.push({
                name: e.text(),
                url: BASE_URL + e.attr("href"),
                host: BASE_URL
            })
        }
        return Response.success(data);
    }
    return null;
}
