load('config.js');

function parseGenres(doc) {
  var genres = [];
  var seen = {};

  doc.select('a.tagshow, .bread a[href*="albums-index-cate-"]').forEach(function(a) {
    var title = textOf(a).trim();
    var href = normalizePathOrUrl(firstAttr(a, ['href']));
    if (!title || !href) return;
    var key = title + '::' + href;
    if (seen[key]) return;
    seen[key] = true;
    genres.push({ title: title, input: href, script: 'gen.js' });
  });

  return genres;
}

function normalizeTitle(v) {
  v = cleanInlineTags((v || '') + '').trim();
  v = v.replace(/\s*-\s*紳士漫畫.*$/i, '').trim();
  v = v.replace(/\s*\|\s*邪惡漫畫.*$/i, '').trim();
  return v;
}

function execute(url) {
  var aid = parseAid(url);
  if (!aid) return Response.error('Invalid detail url');

  var detailUrl = BASE_URL + '/photos-index-aid-' + aid + '.html';
  var response = fetch(detailUrl, { method: 'GET' });
  if (!response.ok) return Response.error('Cannot load detail page');

  var doc = response.html();

  var title = textOf(doc.select('h2').first()).trim();
  if (!title) title = textOf(doc.select('title').first()).trim();
  title = normalizeTitle(title);
  if (!title) return Response.error('Cannot parse title');

  var author = textOf(doc.select('a[href*="f=user_nicename"] p').first()).trim();
  if (!author) author = textOf(doc.select('div.uwuinfo p').first()).trim();
  if (!author) author = 'Unknown';

  var cover = toAbsoluteUrl(firstAttr(doc.select('div.uwthumb img').first(), ['src', 'data-src', 'data-original']));
  if (!cover || cover.indexOf('/data/t/') === -1) {
    cover = toAbsoluteUrl(firstAttr(doc.select('img[src*="/data/t/"]').first(), ['src', 'data-src', 'data-original']));
  }

  var description = textOf(doc.select('div.uwconn p').first()).trim();
  if (!description) description = textOf(doc.select('div.asTBcell p').first()).trim();

  var data = {
    name: title,
    cover: cover,
    author: author,
    description: description,
    host: BASE_URL,
    ongoing: false
  };

  var genres = parseGenres(doc);
  if (genres.length > 0) data.genres = genres;

  return Response.success(data);
}
