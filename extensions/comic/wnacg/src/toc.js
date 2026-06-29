load('config.js');
load('helper.js');

function execute(url) {
  var aid = parseAid(url);
  if (!aid) return Response.error('Invalid detail url');

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
