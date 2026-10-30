load('config.js');

function parseMainComment(item) {
  var avatarEl = item.select('> img.plAv, img.plAv').first();
  var body = item.select('> .plBody, .plBody').first();
  if (!body) return null;

  var name = textOf(body.select('.plName').first()).trim();
  var text = body.select('.plText').first();
  var content = text ? (text.html() || '').trim() : '';
  var time = textOf(body.select('.plTime').first()).trim();

  var comment = {
    name: name,
    avatar: toAbsoluteUrl(firstAttr(avatarEl, ['src'])),
    content: content,
    description: time,
    replies: []
  };

  body.select('.plReplies .plRe, div.plRe').forEach(function(re) {
    var reName = textOf(re.select('.plName').first()).trim();
    var reTime = textOf(re.select('.plTime').first()).trim();
    var reHtml = (re.html() || '') + '';
    reHtml = reHtml.replace(/<span[^>]*class=["']plName["'][^>]*>[\s\S]*?<\/span>/i, '');
    reHtml = reHtml.replace(/<div[^>]*class=["']plMeta["'][^>]*>[\s\S]*?<\/div>/i, '');
    reHtml = reHtml.replace(/^\s*回覆\s*/, '').trim();

    comment.replies.push({
      name: reName,
      avatar: '',
      content: reHtml,
      description: reTime,
      replies: []
    });
  });

  return comment;
}

function execute(input, page) {
  page = parseInt(page || '1', 10) || 1;
  var response = fetch(BASE_URL + '/?ctl=comment&act=frag&aid=' + input + '&sort=hot&page=' + page, { method: 'GET' });
  if (!response.ok) return Response.error('Cannot load comments');

  var items = response.html().select('div.plItem');
  var comments = [];
  items.forEach(function(item) {
    var c = parseMainComment(item);
    if (c && (c.name || c.content)) {
      comments.push(c);
    }
  });

  return Response.success(comments, items.size() >= 10 ? (page + 1) + '' : '');
}
