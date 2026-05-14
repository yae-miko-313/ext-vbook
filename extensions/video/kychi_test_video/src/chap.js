load('config.js');

function execute(url) {
    // Trả về Server Test chứa link video cấu hình trong config.js
    return Response.success([
        { title: "🎬 DIRECT TEST SERVER", data: TEST_VIDEO_URL }
    ]);
}
