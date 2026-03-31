load('config.js');

function execute() {
    return Response.success([
        {title: "All", input:  "/genre-all/sort-new/status-all/all-novel", script: "gen.js"},
//        {title: "Ranking", input:  "/ranking", script: "gen.js"},
        {title: "Latest", input:  "/genre-all/sort-new/status-all/all-novel", script: "gen.js"},
//        {title: "Recently", input:  "/latest-release-novels", script: "gen.js"},
        {title: "Completed", input:  "/genre-all/sort-popular/status-completed/all-novel", script: "gen.js"},
    ]);
}