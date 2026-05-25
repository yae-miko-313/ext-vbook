load("config.js");

function execute() {
  var genreUrl = API_URL + "/wp/v2/genre?per_page=100";
  var response = fetchApi(genreUrl);
  if (!response.ok) {
    return Response.error("Lỗi tải danh sách thể loại: " + response.status);
  }

  var data = response.json();
  var items = parseApiList(data);
  var list = [];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    list.push({
      title: cleanText(item.name),
      input: API_URL + "/wp/v2/manga?genre=" + item.id + "&per_page=20&_embed=wp:featuredmedia,author,wp:term",
      script: "gen.js"
    });
  }

  return Response.success(list);
}
