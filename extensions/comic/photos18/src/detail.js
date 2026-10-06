load("config.js");
function execute(url) {
  id = url.match(/v\/(.+)/)[1];
  let response = fetch(BASE_URL + "/v/" + id);
  if (response.ok) {
    let doc = response.html();
    let name = doc.select("h1.title").first().text();
    return Response.success({
      name: name,
      cover: doc.select("#content a").first().attr("href"),
      author: "Không có tác giả",
      description: "Người tà dâm luôn có quỷ theo sau 😈",
      detail: "书名：" + name + "<br>作者：未知",
      host: BASE_URL,
    });
  }
  return null;
}
