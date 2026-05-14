load('config.js');

function execute(url) {
    return Response.success({
        name: "Phim Test Cấu Hình Tùy Chỉnh",
        cover: COVER_IMAGE,
        author: "kychi",
        description: "Đây là phim mẫu dùng để kiểm tra khả năng phát video.<br>Chỉnh sửa file config.js để thay đổi link video test.",
        detail: "Tình trạng: Thử nghiệm<br>Nguồn: config.js",
        ongoing: true,
        format: "series",
        host: BASE_URL
    });
}
