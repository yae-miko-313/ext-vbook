load('config.js');

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL, script: "gen.js" },
        { title: "Hentai 3D", input: BASE_URL + "/the-loai/3d", script: "gen.js" },
        { title: "Vietsub", input: BASE_URL + "/the-loai/vietsub", script: "gen.js" },
    ]);
}
