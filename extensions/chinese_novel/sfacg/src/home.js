load('config.js');

function execute() {
    return Response.success([
        {title: "魔幻", input: BASE_URL + "/List/default.aspx?tid=21", script: "gen.js"},
        {title: "玄幻", input: BASE_URL + "/List/default.aspx?tid=22", script: "gen.js"},
        {title: "古风", input: BASE_URL + "/List/default.aspx?tid=23", script: "gen.js"},
        {title: "科幻", input: BASE_URL + "/List/default.aspx?tid=24", script: "gen.js"},
        {title: "校园", input: BASE_URL + "/List/default.aspx?tid=25", script: "gen.js"},
        {title: "都市", input: BASE_URL + "/List/default.aspx?tid=26", script: "gen.js"},
        {title: "游戏", input: BASE_URL + "/List/default.aspx?tid=27", script: "gen.js"},
        {title: "同人", input: BASE_URL + "/List/default.aspx?tid=28", script: "gen.js"},
        {title: "悬疑", input: BASE_URL + "/List/default.aspx?tid=29", script: "gen.js"}
    ]);
}
