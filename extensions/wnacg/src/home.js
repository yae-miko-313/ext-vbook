load('config.js');

function execute() {
  return Response.success([
    { title: '更新', input: '/albums-index-page-1.html', script: 'gen.js' },
    { title: '同人志', input: '/albums-index-cate-5.html', script: 'gen.js' },
    { title: '单行本', input: '/albums-index-cate-6.html', script: 'gen.js' },
    { title: '韩漫', input: '/albums-index-cate-19.html', script: 'gen.js' }
  ]);
}
