load('config.js');

function parseGalleryImagesFromText(raw, out, seen) {
  var text = (raw || '') + '';
  var regex = /(?:https?:)?\/\/[^"'\s<>]+\.(?:jpeg|jpg|png|webp|gif)(?:\?[^"'\s<>]*)?/ig;
  var match;
  while ((match = regex.exec(text)) !== null) {
    var src = toAbsoluteUrl(match[0]);
    if (!isGalleryImage(src)) continue;
    if (!seen[src]) {
      seen[src] = true;
      out.push(src);
    }
  }
}

function pagePath(aid, page) {
  if (page === 1) return '/photos-index-aid-' + aid + '.html';
  return '/photos-index-page-' + page + '-aid-' + aid + '.html';
}

function totalPages(doc) {
  var maxPage = 1;
  doc.select('.bot_toolbar .paginator a, .f_left.paginator a').forEach(function(a) {
    var t = textOf(a).trim();
    var n = parseInt(t, 10);
    if (!isNaN(n) && n > maxPage) maxPage = n;

    var href = firstAttr(a, ['href']);
    var m = (href || '').match(/page-(\d+)-aid-/i);
    if (m) {
      var x = parseInt(m[1], 10);
      if (!isNaN(x) && x > maxPage) maxPage = x;
    }
  });
  if (maxPage < 1) maxPage = 1;
  if (maxPage > 120) maxPage = 120;
  return maxPage;
}

function parseImagesFromDoc(doc, out, seen) {
  doc.select('img').forEach(function(img) {
    var src = toAbsoluteUrl(firstAttr(img, ['src', 'data-original', 'data-src']));
    if (!isGalleryImage(src)) return;
    if (!seen[src]) {
      seen[src] = true;
      out.push(src);
    }
  });
}

function parseWithBrowser(url, out, seen) {
  var b = Engine.newBrowser();
  try {
    b.setUserAgent(UserAgent.android);
    b.launch(url, 14000);

    var html = b.html();
    parseGalleryImagesFromText(html, out, seen);

    var urls = b.urls() || [];
    urls.forEach(function(u) {
      u = (u || '') + '';
      if (!isGalleryImage(u)) return;
      var src = toAbsoluteUrl(u);
      if (!seen[src]) {
        seen[src] = true;
        out.push(src);
      }
    });
  } finally {
    b.close();
  }
}

function execute(url) {
  var aid = parseAid(url);
  if (!aid) return Response.error('Invalid chapter url');

  var images = [];
  var seen = {};

  var detailUrl = BASE_URL + '/photos-index-aid-' + aid + '.html';
  var galleryUrl = detailUrl.replace('-index-', '-gallery-');

  var galleryRes = fetch(galleryUrl, { method: 'GET' });
  if (galleryRes.ok) {
    parseGalleryImagesFromText(galleryRes.text(), images, seen);
  }

  if (images.length === 0) {
    var firstRes = fetch(detailUrl, { method: 'GET' });
    if (firstRes.ok) {
      var firstDoc = firstRes.html();
      parseImagesFromDoc(firstDoc, images, seen);

      var maxPage = totalPages(firstDoc);
      for (var p = 2; p <= maxPage; p++) {
        var pageRes = fetch(BASE_URL + pagePath(aid, p), { method: 'GET' });
        if (!pageRes.ok) break;
        parseImagesFromDoc(pageRes.html(), images, seen);
      }
    }
  }

  if (images.length === 0) {
    parseWithBrowser(galleryUrl, images, seen);
  }

  if (images.length === 0) return Response.error('No images');
  return Response.success(images);
}
