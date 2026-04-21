load('config.js');

function buildReqPath(url, page) {
  url = normalizePathOrUrl(url).replace(/\/$/, '');
  page = (page || '1') + '';

  if (page.charAt(0) === '/' || /^https?:\/\//i.test(page)) {
    return normalizePathOrUrl(page);
  }

  if (page === '1') {
    return url || '/albums-index-cate-5.html';
  }

  var mCate = url.match(/\/albums-index-cate-(\d+)\.html/i);
  if (mCate) {
    return '/albums-index-page-' + page + '-cate-' + mCate[1] + '.html';
  }

  var mRank = url.match(/\/albums-favorite_ranking-type-([a-z]+)\.html/i);
  if (mRank) {
    return '/albums-favorite_ranking-page-' + page + '-type-' + mRank[1] + '.html';
  }

  if (url === '/' || !url) {
    return '/albums-index-page-' + page + '.html';
  }

  return url;
}

function parseItemsStructured(doc) {
  var data = [];
  var seen = {};
  doc.select('.gallary_wrap li.gallary_item').forEach(function(li) {
    var titleA = li.select('.info .title a').first();
    var picA = li.select('.pic_box a').first();
    var imgEl = li.select('.pic_box img').first();

    var link = firstAttr(titleA, ['href']);
    if (!link) link = firstAttr(picA, ['href']);
    link = normalizeBookLinkForOutput(link);
    if (!link || link === '/' || seen[link]) return;

    var name = textOf(titleA);
    if (!name) name = firstAttr(picA, ['title']);
    if (!name) name = firstAttr(imgEl, ['alt']);
    name = cleanInlineTags(name).trim();

    var cover = toAbsoluteUrl(firstAttr(imgEl, ['data-original', 'data-src', 'src']));

    seen[link] = true;
    data.push({
      name: name || 'Untitled',
      link: link,
      cover: cover,
      description: '',
      host: BASE_URL
    });
  });
  return data;
}

function parseItemsFallback(doc) {
  var data = [];
  var seen = {};
  doc.select('a[href*="/photos-index-aid-"]').forEach(function(a) {
    var link = normalizeBookLinkForOutput(firstAttr(a, ['href']));
    if (!link || link === '/' || seen[link]) return;

    var img = a.select('img').first();
    if (!img) return;

    var cover = toAbsoluteUrl(firstAttr(img, ['data-original', 'data-src', 'src']));
    if (!isGalleryImage(cover)) return;

    var name = cleanInlineTags(firstAttr(a, ['title'])).trim();
    if (!name) name = cleanInlineTags(firstAttr(img, ['alt'])).trim();

    seen[link] = true;
    data.push({
      name: name || 'Untitled',
      link: link,
      cover: cover,
      description: '',
      host: BASE_URL
    });
  });
  return data;
}

function parseNext(doc) {
  var paginator = doc.select('.bot_toolbar .paginator, .f_left.paginator').first();
  if (!paginator) return null;
  var nextA = paginator.select('.next a').first();
  if (!nextA) return null;

  var href = normalizePathOrUrl(firstAttr(nextA, ['href']));
  return href || null;
}

function execute(url, page) {
  var reqPath = buildReqPath(url, page);
  var response = fetch(BASE_URL + reqPath, { method: 'GET' });
  if (!response.ok) return Response.error('Cannot load list');

  var doc = response.html();
  var data = parseItemsStructured(doc);
  if (data.length === 0) data = parseItemsFallback(doc);

  var next = parseNext(doc);
  return Response.success(data, next);
}
