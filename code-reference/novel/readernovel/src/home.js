load('config.js');

function execute() {
    return Response.success([
        {title: "All", input:  "/browse", script: "gen.js"},
    ]);
}