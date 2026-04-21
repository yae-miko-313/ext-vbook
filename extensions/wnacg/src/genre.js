load('config.js');
function execute() {
  var genres = [
    { title: "同人誌", input: "/albums-index-cate-5.html", script: "gen.js" },
    { title: "單行本", input: "/albums-index-cate-6.html", script: "gen.js" },
    { title: "雜誌&短篇", input: "/albums-index-cate-7.html", script: "gen.js" },
    { title: "韓漫", input: "/albums-index-cate-19.html", script: "gen.js" },
    { title: "Cosplay&寫真集", input: "/albums-index-cate-3.html", script: "gen.js" },
  ];
  return Response.success(genres);
}