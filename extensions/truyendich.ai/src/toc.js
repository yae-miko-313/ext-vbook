load("config.js");

function buildChapterName(element) {
  var title = element.select("span").first();
  if (!title) return cleanText(element.text());

  var fullText = cleanText(title.text());
  var spans = title.select("span");
  if (!spans || spans.size() === 0) return fullText;

  var subtitle = spans.get(spans.size() - 1);
  if (!subtitle) return fullText;

  var subtitleText = cleanText(subtitle.text());
  if (!subtitleText || subtitleText === fullText) return fullText;

  if (fullText.slice(fullText.length - subtitleText.length) === subtitleText) {
    var prefix = cleanText(
      fullText.slice(0, fullText.length - subtitleText.length),
    );
    return prefix ? prefix + " " + subtitleText : subtitleText;
  }

  return fullText;
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

  var data = [];
  response
    .html()
    .select("a[href*=/chuong-]")
    .forEach(function (element) {
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
