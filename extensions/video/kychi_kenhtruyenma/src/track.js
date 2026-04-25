load('config.js');

function execute(url) {
    if (!url) return Response.error("Không có URL audio");

    return Response.success({
        data: url,
        type: "auto", // Dùng auto để đảm bảo luôn phát được
        headers: {
            "Referer": BASE_URL + "/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        host: BASE_URL,
        timeSkip: []
    });
}
