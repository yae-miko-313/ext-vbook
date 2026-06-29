let BASE_URL = "https://crxs.me";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

function cleanText(value) {
  value = value == null ? "" : value + "";
  return value.replace(/\s+/g, " ").trim();
}

function normalizePath(url) {
  url = cleanText(url);
  if (!url) return "";
  url = url.replace(/^[a-z]+:\/\/[^/]+/i, "");
  if (!url) return "";
  if (url.charAt(0) !== "/") url = "/" + url;
  return url;
}

function toAbsoluteUrl(url) {
  url = cleanText(url);
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf("//") === 0) return "https:" + url;
  return BASE_URL + normalizePath(url);
}

function styleBackgroundUrl(value) {
  value = cleanText(value);
  var match = value.match(/url\((['\"]?)(.*?)\1\)/i);
  return match ? toAbsoluteUrl(match[2]) : "";
}

function loadDoc(url) {
  url = toAbsoluteUrl(url);
  var browser = Engine.newBrowser();
  try {
    browser.setUserAgent(UserAgent.android());
    browser.launch(url, 12000);
    return Html.parse(browser.html() + "");
  } finally {
    browser.close();
  }
}

function readFirstText(root, selector) {
  var element = root.select(selector).first();
  return element ? cleanText(element.text() + "") : "";
}

function readFirstHtml(root, selector) {
  var element = root.select(selector).first();
  return element ? element.html() + "" : "";
}

function buildListUrl(input, page) {
  var path = normalizePath(input);
  if (!path) return "";
  if (page) {
    path = path.replace(/\/\d+\.html(?:\?.*)?$/i, "/" + page + ".html");
  }
  return BASE_URL + path;
}

function parseList(doc) {
  var data = [];
  var seen = {};
  doc.select(".list.fiction-list .item.fiction").forEach(function (item) {
    var linkElement = item.select(".text .title a[href]").first();
    if (!linkElement) return;

    var name = cleanText(linkElement.text() + "").replace(/^《|》$/g, "");
    var link = normalizePath(linkElement.attr("href") + "");
    if (!name || !link || seen[link]) return;
    seen[link] = true;

    var coverElement = item.select("a .img").first();
    var cover = coverElement ? styleBackgroundUrl(coverElement.attr("style") + "") : "";
    var description = readFirstText(item, ".brief");

    data.push({
      name: name,
      link: link,
      cover: cover,
      description: description,
      host: BASE_URL,
    });
  });
  return data;
}

function nextFromPager(doc) {
  var nextHref = doc.select(".pager a.next[href]").attr("href") + "";
  var match = nextHref.match(/\/(\d+)\.html(?:[?#].*)?$/);
  return match ? match[1] : null;
}
