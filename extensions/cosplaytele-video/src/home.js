load("config.js");

function execute() {
    return Response.success([
        {
            title: "Video Cosplay",
            input: BASE_URL + "/category/video-cosplayy/page/{{page}}/",
            script: "gen.js"
        }
    ]);
}