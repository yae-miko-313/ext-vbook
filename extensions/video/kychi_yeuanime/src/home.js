load('config.js');

function execute() {
    return Response.success([
        {
            title: "Mới cập nhật",
            input: BASE_URL + "/loc-phim?sort=updated_at&order=desc",
            script: "gen.js"
        },
        {
            title: "Mới đăng",
            input: BASE_URL + "/loc-phim?sort=created_at&order=desc",
            script: "gen.js"
        },
        {
            title: "Phim hot",
            input: BASE_URL + "/loc-phim?sort=views&order=desc",
            script: "gen.js"
        },
        {
            title: "Được yêu thích",
            input: BASE_URL + "/loc-phim?sort=likes&order=desc",
            script: "gen.js"
        },
        {
            title: "Hoạt hình Trung Quốc",
            input: BASE_URL + "/loc-phim?country=trung-quoc&sort=updated_at&order=desc",
            script: "gen.js"
        }
    ]);
}



