function execute() {
    return Response.success([
        {title: "小说首页", input: "/novel", script: "gener.js"},
        {title: "全部小说", input: "/novel/list?keyword=&searchType=1&author=&category=&finished=&space=&source=&tag=&sort=2", script: "updates.js"},
        {title: "小说排行榜", input: "/novel/rank", script: "updates.js"},
        {title: "热门小说", input: "/novel/hot?keyword=", script: "updates.js"},
        {title: "最新上架小说", input: "/novel/new?keyword=&sort=1", script: "updates.js"},
        {title: "最新更新小说", input: "/novel/update?keyword=&sort=2", script: "updates.js"},
    ]);
}