function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        console.log(doc);
        let imgs = doc.select("img.object-cover");
        let data = [];

        imgs.forEach(img => {
            let src = img.attr("src");
            
            // Lọc bỏ ảnh banner hoặc ảnh không phải nội dung truyện
            if (src && !src.includes("zettruyen-wp.webp") && src.includes("zetimage.com")) {
                data.push(src);
            }
        });

        return Response.success(data);
    }
    return null;
}