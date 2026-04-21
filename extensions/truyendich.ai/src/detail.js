load("config.js");

function textFromFirst(element) {
  return element ? cleanText(element.text()) : "";
}

function htmlFromFirst(element) {
  return element ? element.html() : "";
}

function readInfoValue(doc, label) {
  var value = doc
    .select("div:has(> div > span:contains(" + label + ")) > p")
    .first();
  return value ? cleanText(value.text()) : "";
}

function extractGenres(doc) {
  var data = [];
  var seen = {};
  doc.select("a[href^=/the-loai/]").forEach(function (element) {
    var href = normalizeUrl(element.attr("href"));
    var match = href.match(/^\/the-loai\/([^/?#]+)/);
    var title = cleanText(element.text());
    if (!match || !title || seen[match[1]]) return;
    seen[match[1]] = true;
    data.push({
      title: title,
      input: "category:" + match[1],
      script: "gen.js",
    });
  });
  return data;
}

function extractSuggests(doc, currentRoute) {
  if (collectSiblingEditionEntries(doc, currentRoute).length === 0) return [];
  return [
    {
      title: "Các bản dịch khác",
      input: buildDetailRoute(currentRoute),
      script: "edition.js",
    },
  ];
}

function buildDetailText(route, chapterCount, updatedAt, status) {
  var lines = [];
  if (chapterCount) lines.push("Số chương: " + chapterCount);
  if (updatedAt) lines.push("Cập nhật: " + updatedAt);
  if (status) lines.push("Trạng thái: " + status);
  lines.push("Phiên bản: " + getEditionTitle(route.edition));
  return lines.join("<br>");
}

function execute(url) {
  var route = parseRoute(url);
  if (!route) return null;

  var detailUrl = buildDetailRoute(route);
  var response = fetch(buildAbsoluteUrl(detailUrl));
  if (!response.ok) return null;

  var doc = response.html();
  var chapterCount = readInfoValue(doc, "Số chương");
  var updatedAt = readInfoValue(doc, "Cập nhật");
  var status = readInfoValue(doc, "Trạng thái");

  return Response.success({
    name: textFromFirst(doc.select("main header h1").first()),
    cover: buildAbsoluteUrl(doc.select("main header img").attr("src")),
    host: BASE_URL,
    author: readInfoValue(doc, "Tác giả"),
    description: htmlFromFirst(doc.select("section .prose").first()),
    detail: buildDetailText(route, chapterCount, updatedAt, status),
    ongoing: status.indexOf("Đang ra") >= 0,
    genres: extractGenres(doc),
    suggests: extractSuggests(doc, route),
  });
}
