function execute() {
    return Response.success([
        { title: "Latest", input: "latest", script: "gen.js" },
    ]);
}