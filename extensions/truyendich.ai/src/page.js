load("config.js");

function getTotalPages(doc) {
  var lastHref = doc.select("a[title=Trang cuối]").attr("href");
  var match = lastHref.match(/trang-(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function execute(url) {
  var route = parseRoute(url);
  if (!route) return null;

  var currentUrl = buildRoute({
    edition: route.edition,
    slug: route.slug,
    kind: route.kind === "page" ? "page" : "detail",
    pageNo: route.pageNo || 1,
  });
  var response = fetch(buildAbsoluteUrl(currentUrl));
  if (!response.ok) return null;

  var totalPages = getTotalPages(response.html());
  var pages = [];
  for (var pageNo = 1; pageNo <= totalPages; pageNo++) {
    pages.push(
      buildRoute({
        edition: route.edition,
        slug: route.slug,
        kind: pageNo === 1 ? "detail" : "page",
        pageNo: pageNo,
      }),
    );
  }

  return Response.success(pages);
}
