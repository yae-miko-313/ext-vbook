load("config.js");

function execute(url) {
  var doc = loadDoc(url);
  var data = [];
  var seen = {};

  doc.select(".fiction-overview-chapters .chapter-container a[href^='/fiction/id-']").forEach(function (element) {
    var href = normalizePath(element.attr("href") + "");
    var name = readFirstText(element, ".chapter-item");
    if (!name) name = cleanText(element.text() + "");
    if (!name || !href || seen[href]) return;
    seen[href] = true;
    data.push({ name: name, url: href, host: BASE_URL });
  });

  if (data.length === 0 && doc.select(".content-box.fiction-content .fiction-body").size() > 0) {
    return Response.success([{ name: "Full", url: normalizePath(url), host: BASE_URL }]);
  }

  if (data.length === 0) return Response.error("No chapters found");
  return Response.success(data);
}
