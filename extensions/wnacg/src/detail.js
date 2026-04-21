load('config.js');

function parseGenres(doc) {
  var genres = [];
  var seen = {};
  doc.select('.bread a[href*="albums-index-cate-"]').forEach(function(a) {
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

function normalizeTitle(name) {
  name = cleanInlineTags((name || '') + '').trim();
  name = name.replace(/\s*-\s*紳士漫畫.*$/i, '').trim();
  name = name.replace(/\s*\|\s*邪惡漫畫.*$/i, '').trim();
  return name;
}

function execute(url) {
  var aid = parseAid(url);
  if (!aid) return Response.error('Invalid detail url');

  var detailUrl = BASE_URL + '/photos-index-aid-' + aid + '.html';
  var response = fetch(detailUrl, { method: 'GET' });
  if (!response.ok) return Response.error('Cannot load detail page');

  var doc = response.html();

  var name = textOf(doc.select('#bodywrap h2').first()).trim();
  if (!name) name = textOf(doc.select('.asTB h2').first()).trim();
  if (!name) name = textOf(doc.select('title').first()).trim();
  name = normalizeTitle(name);
  if (!name) return Response.error('Cannot parse title');

  var cover = toAbsoluteUrl(firstAttr(doc.select('.uwthumb img').first(), ['data-original', 'data-src', 'src']));
  if (!cover) cover = toAbsoluteUrl(firstAttr(doc.select('img[src*="/data/t/"]').first(), ['src', 'data-src', 'data-original']));

  var author = textOf(doc.select('a[href*="f=user_nicename"]').first()).trim();
  if (!author) author = 'Unknown';

  var description = textOf(doc.select('.uwconn p').first()).trim();
  if (!description) description = textOf(doc.select('.uwconn .asTB').first()).trim();

  var data = {
    name: name,
    cover: cover,
    author: author,
    description: description,
    host: BASE_URL,
    ongoing: true
  };

  var genres = parseGenres(doc);
  if (genres.length > 0) data.genres = genres;

  return Response.success(data);
}
