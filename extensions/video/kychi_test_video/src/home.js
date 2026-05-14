load('config.js');

function execute() {
    return Response.success([
        { title: "🔥 PHIM MỚI CẬP NHẬT", input: BASE_URL + "/phim-moi", script: "gen.js" },
        { title: "🎬 PHIM HÀNH ĐỘNG", input: BASE_URL + "/hanh-dong", script: "gen.js" },
        { title: "📺 PHIM BỘ HOT", input: BASE_URL + "/phim-bo", script: "gen.js" }
    ]);
}
