load('config.js');

// body là .plBody (bình luận gốc) hoặc .plReBody (trả lời); chỉ lấy con trực tiếp để không dính phần trả lời
function parseComment(avatar, body) {
  var head = body.select('> .plHead').first();
  var to = textOf(head.select('.plReTo').first()).trim();
  var time = textOf(head.select('.plTime').first()).trim();
  var text = body.select('> .plText').first();
  return {
    name: textOf(head.select('.plName').first()).trim(),
    avatar: toAbsoluteUrl(firstAttr(avatar, ['src'])),
    content: text ? (text.html() || '') + '' : '',
    description: to ? to + ' · ' + time : time,
    replies: []
  };
}

// input là aid; site tải bình luận theo fragment, 10 bài/trang
function execute(input, page) {
  page = parseInt(page || '1', 10) || 1;
  var response = fetch(BASE_URL + '/?ctl=comment&act=frag&aid=' + input + '&sort=hot&page=' + page, { method: 'GET' });
  if (!response.ok) return Response.error('Cannot load comments');

  var items = response.html().select('div.plItem');
  var comments = [];
  items.forEach(function(item) {
    var c = parseComment(item.select('> img.plAv').first(), item.select('> .plBody').first());
    item.select('div.plRe').forEach(function(re) {
      c.replies.push(parseComment(re.select('> img.plReAv').first(), re.select('> .plReBody').first()));
    });
    comments.push(c);
  });

  return Response.success(comments, items.size() >= 10 ? (page + 1) + '' : '');
}
