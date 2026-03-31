load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    let browser = Engine.newBrowser();
    browser.launch(url, 5000);
    let doc = browser.html();
    browser.close();
    
    var els = doc.select(".image-container[data-index] img");
    var imgs = [];
    els.forEach(el => {
        imgs.push({
            link: el.attr('src') || el.attr('data-src'),
            referer: BASE_URL + '/'
        })
    })
    return Response.success(imgs);
}