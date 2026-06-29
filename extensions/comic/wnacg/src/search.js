load('config.js');

function resolveSearchPath(key, page) {
  page = (page || '1') + '';
  if (page.charAt(0) === '/' || /^https?:\/\//i.test(page)) {
    return normalizePathOrUrl(page);
  }

  var q = encodeURIComponent((key || '') + '');
  return '/search/index.php?s=create_time_DESC&q=' + q + '&p=' + page;
}

function findNearestImage(anchor) {
  if (!anchor) return null;
  var img = anchor.select('img').first();
  if (img) return img;

  var href = firstAttr(anchor, ['href']);
  if (!href) return null;

  var root = anchor.ownerDocument();
  if (!root) return null;

  var sameHref = root.select('a[href="' + href + '"] img').first();
  if (sameHref) return sameHref;

  return root.select('img[src*="/data/t/"]').first();
}

function upsertItem(data, map, link, title, cover) {
  if (!link || link === '/') return;

  var index = map[link];
  var hasIndex = typeof index !== 'undefined';
  var safeTitle = (title || '').trim();
  var safeCover = toAbsoluteUrl(cover);

  if (!safeCover || !isGalleryImage(safeCover)) safeCover = '';

  if (!hasIndex) {
    if (!safeCover) return;
    data.push({
      name: safeTitle || 'Untitled',
      link: link,
      cover: safeCover,
      description: '',
      host: BASE_URL
    });
    map[link] = data.length - 1;
    return;
  }

  var item = data[index];
  if (safeTitle && item.name === 'Untitled') item.name = safeTitle;
  if (!item.cover && safeCover) item.cover = safeCover;
}

function parseItems(doc) {
  var data = [];
  var map = {};

  doc.select('li:has(a[href*="/photos-index-aid-"])').forEach(function(item) {
    var anchors = item.select('a[href*="/photos-index-aid-"]');
    if (!anchors || anchors.size() === 0) return;

    var imageLinkEl = anchors.first();
    var link = normalizeBookLinkForOutput(firstAttr(imageLinkEl, ['href']));

    var img = imageLinkEl.select('img').first();
    if (!img) img = item.select('img[src*="/data/t/"]').first();
    if (!img) img = item.select('img').first();

    var titleEl = item.select('a[href*="/photos-index-aid-"] + a').first();
    if (!titleEl && anchors.size() > 1) titleEl = anchors.get(1);
    if (!titleEl) titleEl = imageLinkEl;

    var title = cleanInlineTags(textOf(titleEl)).trim();
    if (!title) title = cleanInlineTags(firstAttr(titleEl, ['title'])).trim();
    if (!title) title = cleanInlineTags(firstAttr(imageLinkEl, ['title'])).trim();
    if (!title && img) title = cleanInlineTags(firstAttr(img, ['alt'])).trim();

    upsertItem(data, map, link, title, firstAttr(img, ['src', 'data-original', 'data-src']));
  });

  doc.select('a[href*="/photos-index-aid-"]').forEach(function(a) {
    var link = normalizeBookLinkForOutput(firstAttr(a, ['href']));
    if (!link || link === '/') return;

    var title = cleanInlineTags(textOf(a)).trim();
    if (!title) title = cleanInlineTags(firstAttr(a, ['title'])).trim();

    var img = findNearestImage(a);
    if (!title && img) title = cleanInlineTags(firstAttr(img, ['alt'])).trim();

    upsertItem(data, map, link, title, firstAttr(img, ['src', 'data-original', 'data-src']));
  });

  return data;
}

function parseNext(doc) {
  var nextEl = doc.select('span.thispage + a').first();
  if (!nextEl) nextEl = doc.select('.paginator .next a').first();
  if (!nextEl) return null;

  var href = normalizePathOrUrl(firstAttr(nextEl, ['href']));
  return href || null;
}

function execute(key, page) {
  var reqPath = resolveSearchPath(key, page);
  var response = fetch(BASE_URL + reqPath, { method: 'GET' });
  if (!response.ok) return Response.error('Cannot load search page');

  var doc = response.html();
  var data = parseItems(doc);
  var next = parseNext(doc);
  return Response.success(data, next);
}
