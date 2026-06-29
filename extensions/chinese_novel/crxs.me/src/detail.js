load("config.js");

function extractGenresFromSelector(doc, selector) {
  var data = [];
  var seen = {};
  doc.select(selector).forEach(function (element) {
    var href = normalizePath(element.attr("href") + "");
    var title = readFirstText(element, ".tag");
    if (!title) title = cleanText(element.text() + "");
    if (!title || !href || seen[href]) return;
    seen[href] = true;
    data.push({ title: title, input: href, script: "gen.js" });
  });
  return data;
}

function extractGenres(doc) {
  return extractGenresFromSelector(doc, ".fiction-overview-info-item.tags a[href*='/fictions/tag-']");
}

function extractDirectGenres(doc) {
  return extractGenresFromSelector(doc, ".content-box.fiction-content .tags a[href*='/fictions/tag-']");
}

function metaContent(doc, property) {
  var element = doc.select("meta[property=" + property + "]").first();
  if (!element) element = doc.select("meta[name=" + property + "]").first();
  return element ? cleanText(element.attr("content") + "") : "";
}

function isDirectFiction(doc) {
  return doc.select(".content-box.fiction-content .fiction-body").size() > 0 && doc.select(".fiction-overview-info").size() === 0;
}

function executeDirect(url, doc) {
  var name = readFirstText(doc, ".content-box.fiction-content > .title");
  if (!name) name = metaContent(doc, "og:title");
  var description = metaContent(doc, "og:description");
  if (!description) description = readFirstText(doc, ".content-box.fiction-content .fiction-body p");

  return Response.success({
    name: name,
    cover: metaContent(doc, "og:image"),
    host: BASE_URL,
    author: readFirstText(doc, ".content-box.fiction-content .sub-title a[href*='/fictions/keyword-']") || "佚名",
    description: description,
    detail: "单章全文",
    ongoing: false,
    genres: extractDirectGenres(doc),
  });
}

function extractDetail(doc) {
  var parts = [];
  doc.select(".fiction-overview-info-item.word-count, .fiction-overview-info-item.chapter-count, .fiction-completion-read").forEach(function (element) {
    var text = cleanText(element.text() + "");
    if (text) parts.push(text);
  });
  return parts.join("<br>");
}

function execute(url) {
  var doc = loadDoc(url);
  if (isDirectFiction(doc)) return executeDirect(url, doc);
  var coverElement = doc.select(".fiction-cover").first();
  var cover = coverElement ? styleBackgroundUrl(coverElement.attr("style") + "") : "";
  var description = readFirstText(doc, ".fiction-overview-brief").replace(/^导读：\s*/, "");
  var name = readFirstText(doc, ".fiction-overview-info-item.title");
  if (!name) name = readFirstText(doc, "meta[property=og:title]");

  return Response.success({
    name: name,
    cover: cover,
    host: BASE_URL,
    author: readFirstText(doc, ".fiction-overview-info-item.tags:contains(作者) span") || "佚名",
    description: description,
    detail: extractDetail(doc),
    ongoing: true,
    genres: extractGenres(doc),
  });
}
