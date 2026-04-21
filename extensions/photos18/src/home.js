function execute() {
    return Response.success([
        {title: "Latest", input: "/sort/created/", script: "gen.js"},
        {title: "Hottest", input: "/sort/hits/", script: "gen.js"},
        {title: "Trend", input: "/sort/views/", script: "gen.js"},
        {title: "REC.", input: "/sort/score/", script: "gen.js"},
        {title: "Best", input: "/sort/likes/", script: "gen.js"},
    ]);
}
