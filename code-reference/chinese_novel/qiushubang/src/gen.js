load('config.js');

function execute(url, page) {
    if (!page) {
        page = '1';
    }
    let response = fetch(BASE_URL + url + "/" + page + "/");
    if (response.ok) {
        let doc = response.html();

        let bookList = [];
        let next = doc.select(".pagination").select("strong + a").text();
        doc.select(".layout-col2").last().select("li").forEach(e => {
            bookList.push({
                name: e.select(".s2 a").first().text(),
                link: e.select(".s2 a").first().attr("href"),
                description: e.select(".s3").text(),
                host: BASE_URL
            });
        })
        return Response.success(bookList, next);
    }

    return null;
}