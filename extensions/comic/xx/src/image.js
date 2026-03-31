load('config.js');
function execute(url) {
    let response = fetch(url, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0'
        }
    });
    if (response.ok) {
        return Graphics.createImage(response.base64())
    }

    return Response.error("Lỗi load ảnh");
}