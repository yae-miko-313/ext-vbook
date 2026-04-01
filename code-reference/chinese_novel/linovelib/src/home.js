function execute() {
	return Response.success([
		{title: "月點擊榜", input: "/top/monthvisit/", script:"gen.js"},
		{title: "周點擊榜", input: "/top/weekvisit/", script:"gen.js"},
		{title: "月推薦榜", input: "/top/monthvote/", script:"gen.js"},
		{title: "周推薦榜", input: "/top/weekvote/", script:"gen.js"},
		{title: "月鮮花榜", input: "/top/monthflower/", script:"gen.js"},
		{title: "周鮮花榜", input: "/top/weekflower/", script:"gen.js"},
		{title: "月雞蛋榜", input: "/top/monthegg/", script:"gen.js"},
		{title: "周雞蛋榜", input: "/top/weekegg/", script:"gen.js"},
		{title: "最新入庫", input: "/top/postdate/", script:"gen.js"},
		{title: "收藏榜", input: "/top/goodnum/", script:"gen.js"},
		{title: "新書榜", input: "/top/newhot/", script:"gen.js"},
 ]);
}