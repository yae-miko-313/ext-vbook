load("config.js");

var GENRES = [
  ["人妻女友", "/fictions/tag-1.html"],
  ["编辑推荐", "/fictions/tag-101.html"],
  ["长篇连载", "/fictions/tag-102.html"],
  ["都市生活", "/fictions/tag-4.html"],
  ["家庭乱伦", "/fictions/tag-9.html"],
  ["多人群交", "/fictions/tag-10.html"],
  ["强暴性虐", "/fictions/tag-13.html"],
  ["古典玄幻", "/fictions/tag-8.html"],
  ["绿帽主题", "/fictions/tag-16.html"],
  ["学生校园", "/fictions/tag-2.html"],
  ["公司职场", "/fictions/tag-11.html"],
  ["有声小说", "/fictions/tag-999.html"],
  ["经验故事", "/fictions/tag-7.html"],
  ["露出暴露", "/fictions/tag-12.html"],
  ["西方主题", "/fictions/tag-14.html"],
  ["动漫游戏", "/fictions/tag-5.html"],
  ["同性主题", "/fictions/tag-15.html"],
  ["伴侣交换", "/fictions/tag-3.html"],
  ["名人明星", "/fictions/tag-6.html"],
  ["经典回忆", "/fictions/tag-103.html"],
  ["耽美小说", "/fictions/tag-99.html"],
  ["漫画小说", "/fictions/tag-998.html"],
  ["色友发表", "/fictions/tag-1000.html"],
];

function execute() {
  return Response.success(GENRES.map(function (item) {
    return { title: item[0], input: item[1], script: "gen.js" };
  }));
}
