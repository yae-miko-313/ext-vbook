load('config.js');
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var doc = fetch(url).html();

    var getUA = fetch('https://httpbin.org/user-agent')
    var ua = getUA.json()['user-agent'] || USER_AGENT;

    var action_token = doc.select('meta[name="action_token"]').attr("content")

    var resToken = fetch(BASE_URL + '/get_token', {
        headers: {
            'User-Agent': ua,
            'X-Csrf-Token': action_token
        }
    })

    var token = resToken.json().action_token

    var el = doc.select(".text-center .lazy");
    var imgs = [];
    for (var i = 0; i < el.size() - 1; i++) {
        var link = el.get(i).attr("data-src");
        if (link.indexOf("banners") < 0) {
            imgs.push({
                link: `${link.trim()}|${token}`,
                script: 'image.js'
            })
        }
    }
    return Response.success(imgs);
}