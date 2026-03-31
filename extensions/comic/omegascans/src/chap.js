function execute(url) {
    var doc = fetch(url).text();
    const urlPattern = /images\\":\[(.*?)?\]/g;
    const arrayMatch = urlPattern.exec(doc);
    if (arrayMatch) {
        const urlsString = arrayMatch[1];
        // Trích xuất từng URL từ mảng đã tìm được
        const urlRegex = /"([^"]+)"/g;
        let urlMatch;
        const urls = [];
        while ((urlMatch = urlRegex.exec(urlsString)) !== null) {
            urls.push(urlMatch[1].replace("\\",""));
        }
        return Response.success(urls);
    }else{
        return Response.error("Lỗi không xác định!");
    }
}