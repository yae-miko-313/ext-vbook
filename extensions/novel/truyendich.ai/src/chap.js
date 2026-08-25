load('config.js');

function execute(url) {
  var route = parseRoute(url);
  if (!route) return Response.error("URL chương không hợp lệ.");

  var response = fetch(buildAbsoluteUrl(buildRoute(route)));
  if (!response.ok) return Response.error("HTTP " + response.status);

  var doc = response.html();
  var contentRoot =
    doc.select("section.prose-novel").first() ||
    doc.select("[itemprop=text]").first() ||
    doc.select("[itemProp=text]").first();
  if (!contentRoot) return Response.error("Không tìm thấy nội dung chương.");

  contentRoot.select("script,style,button,nav").remove();
  var content = contentRoot.select("div").first();
  return Response.success(
    content ? content.html() : contentRoot.html(),
    cleanText(doc.select("main h1").first().text()),
  );
}
