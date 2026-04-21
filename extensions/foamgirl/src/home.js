function execute() {
    return Response.success([
        {title: "Home", input: "/", script: "gen.js"},
        {title: "Chinese", input: "/chinese/", script: "gen.js"},
        {title: "Japan", input: "/japan/", script: "gen.js"},
        {title: "Japan Aidol", input: "/aidol/", script: "gen.js"},
        {title: "Japan Gravure", input: "/gravure/", script: "gen.js"},
        {title: "Japan Magazine", input: "/magazine/", script: "gen.js"},
        {title: "Korea", input: "/korea/", script: "gen.js"},
        {title: "Thailand", input: "/thailand/", script: "gen.js"},
        {title: "Cosplay", input: "/cosplay/", script: "gen.js"},
    ]);
}
