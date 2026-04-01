load('config.js');

function execute() {
    return Response.success([
        { title: "Truyện Mới Cập Nhật", input: BASE_URL, script: "gen.js" },
        { title: "Top Qidian", input: BASE_URL + "/top-xep-hang-qidian/", script: "gen.js" },
        { title: "Truyện Full", input: BASE_URL + "/the-loai/truyen-full/", script: "gen.js" }
    ]);
}
