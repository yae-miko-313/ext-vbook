load('config.js');

function execute(key, page) {
  if (!page) page = "1";

  var candidates = [
    BASE_URL + "/?s=" + key + "&paged=" + page,
    BASE_URL + "/page/" + page + "/?s=" + key
  ];

  for (var i = 0; i < candidates.length; i++) {
    var url = candidates[i];
    var response = fetch(url, { method: "GET" });
    if (!response.ok) continue;

    var doc = response.html();
    var data = [];
    doc.select("#post-list .col.post-item").forEach(function (e) {
      var a = e.select(".post-title a").first();
      if (!a) return;
      var name = a.text();
      var link = a.attr("href");
      if (link) link = link.replace(BASE_URL, '');
      var img = e.select(".box-image img").first();
      var cover = img ? (img.attr('src') || img.attr('data-src') || img.attr('data-original')) : '';
      data.push({ name: name, link: link, cover: cover });
    });

    var next = '';
    var nextHref = doc.select("a.next.page-numbers").first().attr("href");
    if (nextHref) {
      var m = nextHref.match(/page\/(\d+)/);
      if (m) next = m[1];
    }

    return Response.success(data, next);
  }

  return Response.error("Search failed");
}
