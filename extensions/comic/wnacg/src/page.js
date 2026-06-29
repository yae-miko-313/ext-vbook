load('config.js');

function execute(url) {
  var aid = parseAid(url);
  if (!aid) return Response.error('Invalid detail url');
  var detailUrl = BASE_URL + '/photos-index-aid-' + aid + '.html';
  return Response.success([detailUrl]);
}
