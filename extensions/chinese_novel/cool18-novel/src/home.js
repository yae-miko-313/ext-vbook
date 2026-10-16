function execute() {
    return Response.success([
        { title: "最新帖子", input: "0", script: "latest.js" },
        { title: "精华热帖", input: "gold", script: "rank.js" },
        { title: "人气热贴", input: "hot", script: "rank.js" }
    ]);
}
