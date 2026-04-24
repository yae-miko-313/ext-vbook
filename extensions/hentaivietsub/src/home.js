load("config.js");

function execute() {
    return Response.success([
        { title: "Mới nhất", input: BASE_URL + "?page={{page}}", script: "gen.js" },
        { title: "Top", input: BASE_URL + "/p/top?page={{page}}", script: "gen.js" },
        { title: "Cosplay", input: BASE_URL + "/the-loai/cosplay?page={{page}}", script: "gen.js" },
        { title: "Thể loại", input: "genres-fixed", script: "genre.js" }
    ]);
}