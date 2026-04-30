load("config.js");

function execute(url) {
  var doc = loadDoc(url);
  var content = doc.select(".content-box.fiction-content .fiction-body").first();
  if (!content) return Response.error("No content found");

  content.select("script, style, iframe, ins, .ads, .advertisement, .fiction-chapter-navigator, .fiction-control-btn").remove();
  return Response.success(content.html() + "");
}
