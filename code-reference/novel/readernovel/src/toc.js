function execute(url) {
    let response = fetch(BASE_URL + url);
    if (response.ok) {
        let doc = response.html('utf-8');
        let el = doc.select("ul.list-unstyled.rounded-sketch-4 li a");
        const data = [];
        for (let i = 0;i < el.size(); i++) {
            var e = el.get(i);
            let chapter_id = e.attr("href");
            data.push({
                name: e.select("a").text(),
                url: chapter_id,
                host: BASE_URL
            })
        }
        return Response.success(data);
    }
    return null;
}