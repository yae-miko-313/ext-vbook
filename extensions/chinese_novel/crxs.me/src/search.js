load("config.js");

function cleanKeyword(key) {
  key = cleanText(key);
  key = key.replace(/[\*\"\\?\&<>]/g, "");
  key = key.replace(/\s+/g, "+");
  return key;
}

function execute(key, page) {
  key = cleanKeyword(key);
  if (!key) return Response.success([], null);

  var input = "/fictions/keyword-" + encodeURIComponent(key) + ".html";
  var url = buildListUrl(input, page);
  var doc = loadDoc(url);
  var data = parseList(doc);
  var next = nextFromPager(doc);

  return Response.success(data, next);
}
