load("config.js");

function buildChapterName(element) {
  var spans = element.select("span");
  if (!spans || spans.size() === 0) return cleanText(element.text());

  var chapterLabel = cleanText(spans.first().text());
  if (!chapterLabel) return cleanText(element.text());

  var subtitle = cleanText(spans.last().text());
  if (!subtitle || subtitle === chapterLabel) return chapterLabel;
  if (subtitle.indexOf(chapterLabel) === 0) return subtitle;

  return chapterLabel + " " + subtitle;
}

function execute(url) {
  var route = parseRoute(url);
  if (!route) return null;

  var tocUrl = buildRoute({
    edition: route.edition,
    slug: route.slug,
    kind: route.kind === "page" ? "page" : "detail",
    pageNo: route.pageNo || 1,
  });
  var response = fetch(buildAbsoluteUrl(tocUrl));
  if (!response.ok) return null;

  var doc = response.html();
  var chapterSection = doc.select("section:has(h2:contains(Danh sách chương))").first();
  var chapterElements = chapterSection
    ? chapterSection.select("a[href*=/chuong-]")
    : doc.select("a[href*=/chuong-]");

  var data = [];
  chapterElements.forEach(function (element) {
    var chapterRoute = parseRoute(element.attr("href"));
    if (!chapterRoute || chapterRoute.kind !== "chapter") return;
    chapterRoute.edition = route.edition;

    data.push({
      name: buildChapterName(element),
      url: buildRoute(chapterRoute),
      host: BASE_URL,
    });
  });

  return Response.success(data);
}
