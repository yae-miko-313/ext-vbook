load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var browser = Engine.newBrowser();
    browser.launch(url, 10000);
    browser.callJs(`
        var preTag = document.createElement('pre');
        preTag.id = 'auth_token';
        var authToken = localStorage.getItem("Authorization");
        preTag.textContent = authToken;
        document.body.prepend(preTag);
    `, 2000);
    let doc = browser.html()
    browser.close();

    var imgs = []
    let doc_text = doc.toString()
    let token = doc.select('#auth_token').text()
    let bookId = doc_text.match(/id: \`(\d+)\`/)[1];
    let chapNumber = url.match(/chuong-(\d+)/)[1];

    let json = fetch(`${BASE_URL}/api/chapter/loadAll?comicId=${bookId}&chapterNumber=${chapNumber}&nameEn=nano-ma-than`, {
        method : "POST",
        headers : {
            Referer: BASE_URL,
            Authorization: token || TOKEN,
            'user-agent': USER_AGENT,
        },
    }).json()
    imgs = json.result.data;

    if(!imgs || imgs.length == 0) {
        let jsonString = doc_text.match(/chapterJson: `(.*?)`/)[1];
        let jsonParsed = jsonString && JSON.parse(jsonString);
        let chaps = jsonParsed && jsonParsed.body.result.data
        if(chaps && chaps.length > 0) {
            imgs = chaps;
        }
    }

    if(imgs && imgs.length > 0) {
        let newImgs = []
        imgs.forEach(img => {
            newImgs.push({
                link: img.includes('https') ? img : `${BASE_URL}${img}`,
                referer: BASE_URL,
            })
        })
        return Response.success(newImgs);
    }
    return Response.error("Lỗi mịa rồi T_T");
}