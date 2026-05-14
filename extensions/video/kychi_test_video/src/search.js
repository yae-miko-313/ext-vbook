load('config.js');

function execute(key, page) {
    if (page && page > 1) return Response.success([]);

    return Response.success([
        {
            name: "Kết quả tìm kiếm cho: " + key,
            link: BASE_URL + "/video-test-detail",
            cover: COVER_IMAGE,
            description: "Bấm vào để test trình phát",
            host: BASE_URL
        }
    ]);
}
