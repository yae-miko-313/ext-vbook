load('config.js');

function execute() {
  return Response.success([
    { title: 'Latest', input: '/albums-index-cate-5.html', script: 'gen.js' },
    { title: 'Ranking (Day)', input: '/albums-favorite_ranking-type-day.html', script: 'gen.js' },
    { title: 'Ranking (Week)', input: '/albums-favorite_ranking-type-week.html', script: 'gen.js' },
    { title: 'Ranking (Month)', input: '/albums-favorite_ranking-type-month.html', script: 'gen.js' }
  ]);
}
