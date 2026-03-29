function execute(url) {
    // SSTruyen đôi khi cần User-Agent để tránh bị chặn
    let response = Http.get(url).html();
    
    if (response) {
        // Lấy tên truyện
        let name = response.select("h1[itemprop=name]").text();
        
        // Lấy tác giả (tìm trong thẻ <b>Tác giả:</b> rồi lấy text của thẻ <a> sau nó)
        let author = response.select(".book-info-text [itemprop=author]").text();
        
        // Lấy thể loại (duyệt qua các thẻ a trong li có class li--genres)
        let genres = [];
        response.select(".li--genres a").forEach(genre => {
            genres.push({
                title: genre.text(),
                input: "https://sstruyen.com.vn" + genre.attr("href"),
                script: "gen.js"
            });
        });

        // Lấy mô tả (nội dung giới thiệu truyện)
        let description = response.select(".scrolltext").html();

        // Lấy ảnh bìa (nối host vì src là link tương đối)
        let cover = response.select(".book-info-pic img").attr("src");
        if (cover && !cover.startsWith("http")) cover = "https://sstruyen.com.vn" + cover;

        // Kiểm tra trạng thái Full hay Đang ra
        let status = response.select(".label-status").text();
        let ongoing = status.toLowerCase().indexOf("full") === -1;

        return Response.success({
            name: name,
            author: author,
            description: description,
            cover: cover,
            genres: genres,
            ongoing: ongoing,
            host: "https://sstruyen.com.vn"
        });
    }
    return null;
}