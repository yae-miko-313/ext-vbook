function execute(key, page) {
    if (!page) page = '1';
    
    // Check lại format URL tìm kiếm của trang
    let response = fetch("https://truyenmoikk.com/tim-kiem/?tu-khoa=" + key + "&trang=" + page);
    
    if (response.ok) {
        let doc = response.html();
        let data = [];
        
        let items = doc.select(".list-truyen .row");
        items.forEach(e => {
            data.push({
                name: e.select(".truyen-title a").text(),
                link: e.select(".truyen-title a").attr("href"),
                cover: e.select("img").attr("src"),
                description: e.select(".author").text(),
                host: "https://truyenmoiyy.com"
            });
        });
        
        let next = doc.select(".pagination .active + li a").text();
        return Response.success(data, next);
    }
    return null;
}