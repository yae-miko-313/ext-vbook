load('config.js');

function pagePath(aid, page) {
  if (page === 1) return '/photos-index-aid-' + aid + '.html';
  return '/photos-index-page-' + page + '-aid-' + aid + '.html';
}

function getTotalPages(firstDoc) {
  var maxPage = 1;
  firstDoc.select('.bot_toolbar .paginator a, .f_left.paginator a').forEach(function(a) {
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

function extractImages(doc, out, seen) {
  doc.select('img').forEach(function(img) {
    var src = toAbsoluteUrl(firstAttr(img, ['data-original', 'data-src', 'src']));
    if (!isGalleryImage(src)) return;
    if (!seen[src]) {
      seen[src] = true;
      out.push(src);
    }
  });
}

function extractImagesFromBrowser(path, out, seen) {
  var b = Engine.newBrowser();
  try {
    b.setUserAgent(UserAgent.android);
    b.launchAsync(BASE_URL + path);
    sleep(3200);

    for (var i = 0; i < 4; i++) {
      b.callJs('window.scrollTo(0, document.body.scrollHeight);', 900);
      sleep(900);
    }

    var html = b.html();
    if (html) {
      var doc = Html.parse((html || '') + '');
      extractImages(doc, out, seen);
    }

    var urls = b.urls() || [];
    urls.forEach(function(u) {
      u = (u || '') + '';
      if (u.indexOf('/data/t/') === -1) return;
      var src = toAbsoluteUrl(u);
      if (!isGalleryImage(src)) return;
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

  var firstRes = fetch(BASE_URL + pagePath(aid, 1), { method: 'GET' });
  if (firstRes.ok) {
    var firstDoc = firstRes.html();
    extractImages(firstDoc, images, seen);

    var totalPages = getTotalPages(firstDoc);
    for (var page = 2; page <= totalPages; page++) {
      var response = fetch(BASE_URL + pagePath(aid, page), { method: 'GET' });
      if (!response.ok) break;
      var doc = response.html();
      extractImages(doc, images, seen);
    }
  }

  if (images.length < 5) {
    extractImagesFromBrowser('/photos-slist-aid-' + aid + '.html', images, seen);
  }
  if (images.length < 5) {
    extractImagesFromBrowser('/photos-list-aid-' + aid + '.html', images, seen);
  }
  if (images.length < 5) {
    extractImagesFromBrowser('/photos-slide-aid-' + aid + '.html', images, seen);
  }

  if (images.length === 0) return Response.error('No images');
  return Response.success(images);
}
