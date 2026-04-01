load('config.js');

function execute(url) {
    let response = fetch(url)
    if(!response.ok) return null;

    let doc = response.html()
    let imgs = doc.select('.page-chapter > img');
    let data = [];

    imgs.forEach(elm => {
        let fallback = []
        if(elm.attr("data-original")) {
            let img = elm.attr("data-original")
            if(img.indexOf("mangaqq.net") > -1) {
                fallback.push(img.replace("ntcdn242.wibu.asia/qq", "ntcdn160.wibu.asia/bt").replace("i2.netcdn.one", "i2.wp.com/i2.netcdn.one"))
            }
            if(img.indexOf("i2.netcdn.one") > -1) {
                fallback.push(img.replace("i2.netcdn.one", "manga-covers.vercel.app/api/proxy?url=https://i2.netcdn.one"))
                fallback.push(img.replace("i2.netcdn.one", "https://wsrv.nl/?url=https://i2.netcdn.one"))
            }
        }
        if(elm.attr("data-src")) {
            fallback.push(elm.attr("data-src"))
        }

        data.push({
            link: elm.attr("src").split('?')[0],
            fallback: fallback,
        });
    })
    return Response.success(data);
}
