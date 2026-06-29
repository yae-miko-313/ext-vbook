load("config.js");

function execute() {
  return Response.success([
    { title: "最新", input: "/fictions/1.html", script: "gen.js" },
    { title: "浏览最多", input: "/fictions/sort-read/1.html", script: "gen.js" },
    { title: "编辑推荐", input: "/fictions/tag-101.html", script: "gen.js" },
  ]);
}
