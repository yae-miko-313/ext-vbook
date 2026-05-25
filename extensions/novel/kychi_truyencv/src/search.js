load("config.js");

function execute(key, page) {
  if (!page) page = "1";
  var searchUrl = API_URL + "/wp/v2/manga?search=" + encodeURIComponent(key) + "&per_page=20&page=" + page + "&_embed=wp:featuredmedia,author,wp:term";
  
  var response = fetchApi(searchUrl);
  if (!response.ok) {
    return Response.error("Lỗi tìm kiếm: " + response.status);
  }

  var data = response.json();
  var items = parseApiList(data);
  var list = [];

  if (items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      list.push({
        name: getTitleText(item),
        link: buildMangaLink(item.slug),
        cover: extractCoverUrl(item),
        description: extractAuthorName(item),
        host: BASE_URL
      });
    }
  }

  // Decide per-page to know when to stop. Default 20.
  var perPage = 20;
  var perMatch = searchUrl.match(/[?&](?:per_page|limit)=?(\d+)/i);
  if (perMatch && perMatch[1]) {
    perPage = parseInt(perMatch[1], 10) || perPage;
  }

  var next = "";
  if (list.length > 0 && items.length >= perPage) {
    next = (parseInt(page, 10) + 1).toString();
  }

  return Response.success(list, next);
}

