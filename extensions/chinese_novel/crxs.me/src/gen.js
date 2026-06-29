load("config.js");

function execute(input, page) {
  var url = buildListUrl(input, page);
  if (!url) return Response.error("Invalid list url");

  var doc = loadDoc(url);
  var data = parseList(doc);
  var next = nextFromPager(doc);

  return Response.success(data, next);
}
