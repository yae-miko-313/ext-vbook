load('config.js');

function buildSearchPath(key, page) {
  page = (page || '1') + '';
  if (page.charAt(0) === '/' || /^https?:\/\//i.test(page)) {
    return normalizePathOrUrl(page);
  }

  var q = encodeURIComponent((key || '') + '');
  return '/search/index.php?q=' + q + '&m=&syn=yes&f=_all&s=create_time_DESC&p=' + page;
}

function parseItems(doc) {
  var data = [];
  doc.select('.gallary_wrap li.gallary_item').forEach(function(li) {
    var titleA = li.select('.info .title a').first();
    var picA = li.select('.pic_box a').first();
    var imgEl = li.select('.pic_box img').first();

    var link = firstAttr(titleA, ['href']);
    if (!link) link = firstAttr(picA, ['href']);
    link = normalizeBookLinkForOutput(link);
    if (!link || link === '/') return;

    var name = textOf(titleA);
    if (!name) name = firstAttr(picA, ['title']);
    if (!name) name = firstAttr(imgEl, ['alt']);
    name = cleanInlineTags(name).trim();

    var cover = toAbsoluteUrl(firstAttr(imgEl, ['data-original', 'data-src', 'src']));

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

function execute(key, page) {
  var reqPath = buildSearchPath(key, page);
  var response = fetch(BASE_URL + reqPath, { method: 'GET' });
  if (!response.ok) return Response.error('Cannot load search page');

  var doc = response.html();
  var data = parseItems(doc);
  var next = parseNext(doc);

  return Response.success(data, next);
}
