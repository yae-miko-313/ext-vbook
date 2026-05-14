load('config.js');

function execute(url, page) {
    if (page && page > 1) return Response.success([]);

    // QUAN TRỌNG: Phải dùng trường 'link' thay vì 'url' cho Video Extension
    return Response.success([
        {
            name: "Phim Test Cấu Hình Tùy Chỉnh",
            link: BASE_URL + "/phim-test-detail", // Link giả để trỏ vào detail.js
            cover: COVER_IMAGE,
            description: "Thử nghiệm luồng phát với config hiện tại.",
            host: BASE_URL
        }
    ]);
}
