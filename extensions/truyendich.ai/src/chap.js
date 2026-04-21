load("config.js");

function execute(url) {
  var route = parseRoute(url);
  if (!route) return null;

  var response = fetch(buildAbsoluteUrl(buildRoute(route)));
  if (!response.ok) return null;

  var doc = response.html();
  var contentRoot =
    doc.select("section.prose-novel").first() ||
    doc.select("[itemprop=text]").first() ||
    doc.select("[itemProp=text]").first();
  if (!contentRoot) return null;

  contentRoot.select("script,style,button,nav").remove();
  var content = contentRoot.select("div").first();
  return Response.success(content ? content.html() : contentRoot.html());
}
