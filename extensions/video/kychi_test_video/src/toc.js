load('config.js');

function execute(url) {
    // Trả về một tập phim giả định để kích hoạt chap.js
    return Response.success([
        { 
            name: "Tập Test", 
            url: BASE_URL + "/test",
            host: BASE_URL
        }
    ]);
}
