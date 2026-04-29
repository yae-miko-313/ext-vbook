load('config.js');

function execute() {
    return Response.success([
        { title: "推荐榜", input: BASE_URL + "/get_discover?source=番茄&tab=小说&type=10&gender=1&is_ranking=1", script: "gen.js" },
        { title: "完结榜", input: BASE_URL + "/get_discover?source=番茄&tab=小说&type=11&gender=1&is_ranking=1", script: "gen.js" },
        { title: "热搜榜", input: BASE_URL + "/get_discover?source=番茄&tab=小说&type=12&gender=1&is_ranking=1", script: "gen.js" },
        { title: "都市", input: BASE_URL + "/get_discover?source=番茄&tab=小说&type=1&gender=1&page={{page}}", script: "gen.js" },
        { title: "玄幻", input: BASE_URL + "/get_discover?source=番茄&tab=小说&type=7&gender=1&page={{page}}", script: "gen.js" }
    ]);
}
