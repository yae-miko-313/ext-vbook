load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    let response = fetch(url)
    if(!response.ok) return null
    let doc = response.html()
    let els = doc.select(".w-full.mx-auto > img:not([title='banner'])");
    let imgs = [];
    els.forEach(el => {
        imgs.push(el.attr('src'))
    })
    return Response.success(imgs);
}