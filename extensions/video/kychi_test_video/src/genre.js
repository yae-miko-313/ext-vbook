function execute() {
    return Response.success([
        { title: "Hành động", input: "hanh-dong", script: "gen.js" },
        { title: "Cổ trang", input: "co-trang", script: "gen.js" },
        { title: "Kiếm hiệp", input: "kiem-hiep", script: "gen.js" }
    ]);
}
