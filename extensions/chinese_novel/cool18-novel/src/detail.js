load("config.js");
function execute(url) {
  let response = fetch(url);
  if (response.ok) {
    let doc = response.html();
    Console.log(doc);
    let name = doc.select("h1.main-title").text();
    let author = doc.select("span.sender a").text();
    let data = {
      name: name,
      cover: null,
      author: author,
      description: "Không có mô tả",
      detail: "书名：" + name + "<br>作者：" + (author || "未知"),
      ongoing: false,
      host: BASE_URL,
    };
    return Response.success(data);
  }
  return null;
}
