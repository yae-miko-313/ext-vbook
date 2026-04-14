load('config.js');

function textAt(nodes, index) {
    return nodes && nodes.size() > index ? nodes.get(index).text().trim() : '';
}

function execute(url) {
    var response = fetch(url, {
        headers: {
            'User-Agent': BASE_UA
        }
    });

    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();
    var infoStrong = doc.select('p strong');

    var cover = '';
    var img = doc.select('#chapter_001 img, .container img').first();
    if (img) cover = img.attr('src') || '';
    if (cover.indexOf('//') === 0) cover = 'https:' + cover;

    var statusText = textAt(infoStrong, 3);
    var ongoing = statusText ? statusText.toLowerCase().indexOf('hoàn thành') < 0 : true;

    return Response.success({
        name: doc.select('h1').text().trim(),
        cover: cover,
        description: doc.select('.smiley p').html(),
        author: textAt(infoStrong, 2),
        detail: doc.select("div[class='p-2 leading-7 text-justify lg:flex-1'], .p-2.leading-7.text-justify").first()
            ? doc.select("div[class='p-2 leading-7 text-justify lg:flex-1'], .p-2.leading-7.text-justify").first().html()
            : '',
        ongoing: ongoing,
        host: BASE_URL
    });
}
