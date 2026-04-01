function execute() {
	return Response.success([
		{title: "月点击榜", input: "/top/monthvisit/", script:"gen.js"},
		{title: "周点击榜", input: "/top/weekvisit/", script:"gen.js"},
		{title: "月推荐榜", input: "/top/monthvote/", script:"gen.js"},
		{title: "周推荐榜", input: "/top/weekvote/", script:"gen.js"},
		{title: "月鲜花榜", input: "/top/monthflower/", script:"gen.js"},
		{title: "周鲜花榜", input: "/top/weekflower/", script:"gen.js"},
		{title: "月鸡蛋榜", input: "/top/monthegg/", script:"gen.js"},
		{title: "周鸡蛋榜", input: "/top/weekegg/", script:"gen.js"},
		{title: "最近更新", input: "/top/lastupdate/", script:"gen.js"},
		{title: "最新入库", input: "/top/postdate/", script:"gen.js"},
		{title: "收藏榜", input: "/top/goodnum/", script:"gen.js"},
		{title: "新书榜", input: "/top/newhot/", script:"gen.js"},

	]);
}