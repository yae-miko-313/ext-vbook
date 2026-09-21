function execute() {
    return Response.success([
        {title: "最新更新", input: "/novel/list?sort=2", script: "updates.js"},
        {title: "观看量", input: "/novel/list?sort=3", script: "updates.js"},
        {title: "收藏量", input: "/novel/list?sort=4", script: "updates.js"},
        {title: "评分", input: "/novel/list?sort=5", script: "updates.js"},
        {title: "小说排行榜", input: "/novel/rank", script: "updates.js"},
    ]);
}
