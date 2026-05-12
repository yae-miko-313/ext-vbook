function execute(data) {
   
    var type = "auto";

    // Sử dụng chính sách No Referer để tránh bị chặn bởi các trình phát bên thứ ba
    var headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    };

    return Response.success({
        data: data,
        type: type,
        headers: headers
    });
}