load('config.js');
function execute(url) {
    let idMatch = url.match(/\/detail\/(\d+)/);
    let id = idMatch ? idMatch[1] : '';
    let url_cmt = BASE_URL + "/index/commentList?type=1&target_id=" + id;
  console.log(url_cmt);
  var response = fetch(url);
  if (response.ok) {
    var doc = response.html();
    let nameEl = doc.select('div.flex-1 h2');
    let name = nameEl.size() > 1 ? nameEl.get(1).text() : (nameEl.size() > 0 ? nameEl.get(0).text() : '');
    let author = doc.select('a[href*="author="]').first() != null ? doc.select('a[href*="author="]').first().text() : '';
    let coverEl = doc.select('section img[data-src], .poster img[data-src], main img[data-src]');
    let cover = coverEl.size() > 0 ? coverEl.first().attr('data-src') : '';
    let genres = [];
    doc.select('a[href*="/novel/all/"]').forEach(e => {
      genres.push({
        title: e.text(),
        input:  e.attr("href"),
        script: "gen.js"
      });
    });
    return Response.success({
      name: name,
      cover: "https://base64-image.luhanhgia09.workers.dev/proxy?url=" + cover,
      author: author,
      description: doc.select('meta[name="description"]').attr('content'),
      host: BASE_URL,
      genres: genres,
      comment: {
        input: url_cmt,
        script: "comment.js"
      },
    });
  }
  return null;
}