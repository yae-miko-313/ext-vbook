load("config.js");

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let comicId = doc.select("input#hidComicId").first().attr("value");
        // let refreshToken = doc.select("input[name=__RequestVerificationToken]").first().attr("value");
        let cookies = response.request.headers.cookie;
        var header = {
            "Content-Type": "application/json; charset=UTF-8",
            "Cookie": cookies,
            "origin": BASE_URL,
            // "requestverificationtoken": refreshToken,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
            "x-requested-with": "XMLHttpRequest"
        }
        var body = {
            "comicId": comicId,
            "isAuthenticated": false,
            "isFirstLoadFb": true,
            "chapters": [],
            "sort": 0,
        }
        // console.log(JSON.stringify(body));
        // get chaps
        let responseChap = fetch(BASE_URL + "/ajax?handler=listChapterByComicId&comicId="+comicId, {
            method: "GET",
            headers: header,
            // body: JSON.stringify(body)
        });
        if (responseChap.ok) {
            let jsonData = responseChap.json();
            // console.log(JSON.stringify(jsonData));
            let chapters = [];

            jsonData.forEach(item => {
                chapters.push({
                    name: item.name,
                    url: BASE_URL + item.seoAlias,
                    host: BASE_URL
                })
            });
            return Response.success(chapters);
        }

    }

    return null
}