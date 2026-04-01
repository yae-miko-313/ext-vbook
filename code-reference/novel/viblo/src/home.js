function execute() {
    return Response.success([
        { title: "Tin Mới", input: "/newest", script: "gen.js" },
    ]);
}