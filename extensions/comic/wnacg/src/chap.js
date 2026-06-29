load('config.js');
load('helper.js');

function parsePart(url) {
  var m = ((url || '') + '').match(/[?&]part=(\d+)/i);
  if (!m) return 1;
  var part = parseInt(m[1], 10);
  return isNaN(part) || part < 1 ? 1 : part;
}

function execute(url) {
  var aid = parseAid(url);
  if (!aid) return Response.error('Invalid chapter url');

  var images = getImages(aid);
  if (!images) return Response.error('Cannot load item data');
  if (images.length === 0) return Response.error('No images');

  var part = parsePart(url);
  var start = (part - 1) * 50;
  if (start >= images.length) return Response.error('Invalid chapter part');
  var end = start + 50;
  if (end > images.length) end = images.length;

  return Response.success(images.slice(start, end));
}
