load('config.js');
// https://www.uaa.com/novel/list?searchType=1&keyword=18%2B
// https://www.uaa.com/novel/list?keyword=M&searchType=1&author=&category=&finished=&space=&source=&tag=&sort=0&page=2
function execute(key, page) {
    if (!page) page = '1';
    let response = fetch(BASE_URL + "/novel/list?&keyword=" + key + "&searchType=1&author=&category=&finished=&space=&source=&tag=&sort=0&page=" + page);
    if (response.ok) {
        let doc= response.html();
        
        const data = [];
        
        doc.select(".main_box .novel_list_box ul li").forEach(e => {
            console.log(e)
            data.push({
                name: e.select(".title").text(),
                link: e.select(".cover_box a").attr('href'),
                cover: e.select(".cover_box a img").attr('src'),
                description: e.select(".info_box a").first().text(),
                
                host: BASE_URL
            });
        });
        let next = (parseInt(page) + 1).toString();
        return Response.success(data, next);
    }
    return null;
}