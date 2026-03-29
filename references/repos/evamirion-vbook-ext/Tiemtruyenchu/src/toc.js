// load('config.js');
//
//function execute(url) {
//    let book_id = "";
//    if(url.includes("https://tiemtruyenchu.com")){
//        book_id = url.split("/truyen/")[1]
//    }
//    console.log(book_id)
//    let response = fetch(url);
//    if (response.ok) {
//        let doc = response.html('utf-8');
//		let chapnum = Number(doc.select("a.text-decoration-none.text-primary.fw-bold.hover-danger.latest-chap-link").attr("href").split("chuong/")[1]) +1
//        const data = [];
//        for (let i = 1;i < chapnum; i++) {
//            data.push({
//                name: "Chương " + i ,
//                url: "https://tiemtruyenchu.com/doc-truyen/" + book_id + "/chuong/" + i,
//                host: "https://tiemtruyenchu.com"
//            })
//        }
//        return Response.success(data);
//    }
//    return null;
//} 


function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('utf-8');
        const data = [];
		let table = doc.select("div.row.g-2 div.col-md-6.col-12 a")
        table.forEach(e => {
            data.push({
                name: e.select("a").first().text(),
                url: e.select("a").first().attr("href"),
                host: "https://tiemtruyenchu.com"
            })
        });
        let next = doc.select("div.chapter-page").attr("id").split("page-")[1]
        return Response.success(data, next)
    }
    return null;
}