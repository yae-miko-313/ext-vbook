load('config.js');

function execute(data) {
    // data chính là TEST_VIDEO_URL truyền từ chap.js
    // type: "native" -> Dành cho link .m3u8, .mp4 (vBook sẽ phát trực tiếp qua ExoPlayer)
    // type: "auto" -> vBook tự quyết định dựa trên Content-Type // phù hợp với type embed video
    return Response.success({
        data: data,
        type: "auto", // Mặc định là auto vì hầu hết link test là web embed
        headers: {
            "Referer": DEFAULT_REFERER,
            "User-Agent": DEFAULT_UA
        }
    });
}
