load('config.js');
function execute() {
    return Response.success([
        {title: "Truyện mới", input: BASE_URL + "/tim-truyen", script: "gen.js"},
    ]);
}