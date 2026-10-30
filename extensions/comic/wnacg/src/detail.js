load('config.js');

function parseGenres(doc) {
  var genres = [];
  var seen = {};

  doc.select('a.dv-tag, a.tagshow, a[href*="/albums-index-tag-"], a[href*="/albums-index-cate-"]').forEach(function(a) {
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
  url = normalizeUrl(url);
  var aid = parseAid(url);
  if (!aid) return Response.error('Invalid detail url');

  var detailUrl = BASE_URL + '/photos-index-aid-' + aid + '.html';
  // UA mặc định của app nhận bản mobile, thiếu khối thông tin/簡介
  var response = fetch(detailUrl, { method: 'GET', headers: { 'user-agent': UserAgent.chrome() } });
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

  var descEl = doc.select('div.uwconn > p').first();
  var description = descEl ? ((descEl.html() || '') + '').replace(/^\s*簡介：/, '').trim() : '';
  if (!description) description = textOf(doc.select('div.asTBcell p').first()).trim();

  // `detail` render dạng HTML nên ngắt dòng bằng <br>
  var info = ['书名：' + title, '作者：' + (author !== 'Unknown' ? author : '未知')];
  doc.select('div.uwconn > label').forEach(function(label) {
    var text = textOf(label).trim();
    if (text) info.push(text);
  });

  var data = {
    name: title,
    cover: cover,
    author: author,
    description: description,
    detail: info.join('<br>\n'),
    url: detailUrl,
    type: 'comic',
    format: 'comic',
    host: BASE_URL,
    ongoing: false
  };

  var genres = parseGenres(doc);
  if (genres.length > 0) data.genres = genres;

  // Danh sách truyện của người đăng (上傳者)
  var uploaderHref = firstAttr(doc.select('div.uwuinfo a[href*="/albums-user-uid-"]').first(), ['href']);
  if (uploaderHref) {
    data.suggests = [{ title: '上傳者作品', input: normalizePathOrUrl(uploaderHref), script: 'gen.js' }];
  }

  data.comments = [{ title: '評論', input: aid, script: 'comment.js' }];

  return Response.success(data);
}
