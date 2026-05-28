load('config.js');

function execute() {
    return Response.success([
        { title: "Truyện mới cập nhật", input: BASE_URL + "/tim-kiem?page=", script: "gen.js" },
        { title: "Truyện dịch", input: BASE_URL + "/tim-kiem?t=2&page=", script: "gen.js" },
        { title: "Truyện convert", input: BASE_URL + "/tim-kiem?t=1&page=", script: "gen.js" },
        { title: "AI dịch", input: BASE_URL + "/tim-kiem?t=4&page=", script: "gen.js" },
        { title: "Truyện đã hoàn thành", input: BASE_URL + "/tim-kiem?st=20&page=", script: "gen.js" }
    ]);
}
