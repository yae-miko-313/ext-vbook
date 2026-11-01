load('libs.js');
load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    url = url.replace("/txt/","/book/")
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let name = $.Q(doc, 'div.booknav2 > h1 > a').text();
        let author = $.Q(doc, 'div.booknav2 > p:nth-child(2) > a').text().trim();
        // Dòng 作者 của site đã có ở đầu detail, bỏ để không trùng
        let info = $.QA(doc, 'div.booknav2 p', {m: x => x.text().trim()}).filter(t => t && t.indexOf('作者') !== 0);

        return Response.success({
            name: name,
            cover: $.Q(doc, 'div.bookimg2 > img').attr('src'),
            author: author,
            description: $.Q(doc, 'div.navtxt > p').html(),
            detail: ['书名：' + name, '作者：' + (author || '未知')].concat(info).join('<br>'),
            host: BASE_URL
        })
    }
    return null;
}