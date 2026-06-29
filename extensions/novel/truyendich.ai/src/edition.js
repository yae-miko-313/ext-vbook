load("config.js");

function textFromFirst(element) {
  return element ? cleanText(element.text()) : "";
}

function buildEditionItems(doc, currentRoute) {
  var name = textFromFirst(doc.select("main header h1").first());
  var cover = buildAbsoluteUrl(doc.select("main header img").attr("src"));
  var data = [];

  collectSiblingEditionEntries(doc, currentRoute).forEach(function (item) {
    data.push({
      name: name ? name + " - " + item.title : item.title,
      link: item.key,
      host: BASE_URL,
      cover: cover,
      description: "Phiên bản: " + item.title,
    });
  });

  return data;
}

function execute(input) {
  var route = parseRoute(input);
  if (!route) return null;

  var response = fetch(buildAbsoluteUrl(buildDetailRoute(route)));
  if (!response.ok) return null;

  return Response.success(buildEditionItems(response.html(), route));
}
