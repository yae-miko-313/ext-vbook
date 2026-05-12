function execute(data) {
    // data là link m3u8 hoặc link embed nhận từ chap.js
    var type = "native";
    if (data.indexOf(".m3u8") === -1 && data.indexOf(".mp4") === -1) {
        type = "iframe";
    }

    return Response.success({
        data: data,
        type: type,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Referer": "https://ophim17.cc/",
            "Origin": "https://ophim17.cc"
        }
    });
}
