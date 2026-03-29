load("config.js");

function execute(url) {
  const regex = /(?:book_id=|\/)(\d+)$/;
  let book_id = url.match(regex)[1];
  let newurl = `${homepage}/page/${book_id}`;
  console.log(newurl);

  let response = fetch(newurl);
  if (response.ok) {
    let doc = response.html();

    let el = doc.select(".page-directory-content a.chapter-item-title");

    const book = [];
    for (var i = 0; i < el.size(); i++) {
      var e = el.get(i);
      book.push({
        name: e.text(),
        url: homepage + "" + e.attr("href"),
        host: homepage,
      });
    }
    return Response.success(book);
  }
  return null;
}
