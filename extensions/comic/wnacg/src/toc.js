load('config.js');
load('helper.js');

// Truyện hợp tập (合集): mỗi 話 là 1 gallery riêng, mục lục phân trang 12 話/trang
function getSeriesChapters(aid) {
  var chapters = [];
  var seen = {};
  var pageUrl = BASE_URL + '/photos-index-aid-' + aid + '.html';
  for (var page = 1; pageUrl && page <= 100; page++) {
    // UA mặc định của app nhận bản mobile, không có khối 章節目錄
    var response = fetch(pageUrl, { method: 'GET', headers: { 'user-agent': UserAgent.chrome() } });
    if (!response.ok) break;
    var doc = response.html();

    // Truyện lẻ cũng có paginator (trang ảnh thu nhỏ), không có chương thì dừng
    var links = doc.select('a.tagshow[data-chid]');
    if (links.size() === 0) break;
    links.forEach(function(a) {
      var chid = firstAttr(a, ['data-chid']);
      if (!chid || seen[chid]) return;
      seen[chid] = true;
      chapters.push({
        name: textOf(a).trim(),
        url: BASE_URL + '/photos-index-aid-' + chid + '.html',
        host: BASE_URL
      });
    });

    var next = firstAttr(doc.select('.paginator .next a').first(), ['href']);
    pageUrl = next ? toAbsoluteUrl(next) : '';
  }

  // Site có thể trả 倒序 (theo cookie), sắp lại theo số 第N話
  var allNumbered = chapters.every(function(c) { return /第(\d+)話/.test(c.name); });
  if (allNumbered) {
    chapters.sort(function(a, b) {
      return parseInt(a.name.match(/第(\d+)話/)[1], 10) - parseInt(b.name.match(/第(\d+)話/)[1], 10);
    });
  }
  return chapters;
}

function execute(url) {
  var aid = parseAid(url);
  if (!aid) return Response.error('Invalid detail url');

  var seriesChapters = getSeriesChapters(aid);
  if (seriesChapters.length > 0) return Response.success(seriesChapters);

  var images = getImages(aid);
  if (!images) return Response.error('Cannot load item data');
  if (images.length === 0) return Response.error('No images');

  var detailUrl = BASE_URL + '/photos-index-aid-' + aid + '.html';
  var chapters = [];
  var totalParts = Math.ceil(images.length / 50);
  for (var i = 1; i <= totalParts; i++) {
    var start = (i - 1) * 50 + 1;
    var end = i * 50;
    if (end > images.length) end = images.length;
    chapters.push({
      name: totalParts === 1 ? 'Gallery' : 'Gallery ' + i + ' (' + start + '-' + end + ')',
      url: detailUrl + '?part=' + i,
      host: BASE_URL
    });
  }

  return Response.success(chapters);
}
