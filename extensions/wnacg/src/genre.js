load('config.js');

function execute() {
  return Response.success([
    { title: '更新', input: '/albums-index-page-1.html', script: 'gen.js' },
    { title: '同人志', input: '/albums-index-cate-5.html', script: 'gen.js' },
    { title: '同人志-汉化', input: '/albums-index-cate-1.html', script: 'gen.js' },
    { title: '同人志-日语', input: '/albums-index-cate-12.html', script: 'gen.js' },
    { title: '同人志-English', input: '/albums-index-cate-16.html', script: 'gen.js' },
    { title: '同人志-CG书籍', input: '/albums-index-cate-2.html', script: 'gen.js' },
    { title: '写真&Cosplay', input: '/albums-index-cate-3.html', script: 'gen.js' },
    { title: '单行本', input: '/albums-index-cate-6.html', script: 'gen.js' },
    { title: '单行本-汉化', input: '/albums-index-cate-9.html', script: 'gen.js' },
    { title: '单行本-日语', input: '/albums-index-cate-13.html', script: 'gen.js' },
    { title: '单行本-English', input: '/albums-index-cate-17.html', script: 'gen.js' },
    { title: '杂志&短篇', input: '/albums-index-cate-7.html', script: 'gen.js' },
    { title: '杂志&短篇-日语', input: '/albums-index-cate-14.html', script: 'gen.js' },
    { title: '杂志&短篇-English', input: '/albums-index-cate-18.html', script: 'gen.js' },
    { title: '韩漫', input: '/albums-index-cate-19.html', script: 'gen.js' },
    { title: '韩漫-汉化', input: '/albums-index-cate-20.html', script: 'gen.js' },
    { title: '韩漫-生肉', input: '/albums-index-cate-21.html', script: 'gen.js' },
    { title: '3D&漫画', input: '/albums-index-cate-22.html', script: 'gen.js' },
    { title: '3D&漫画-汉语', input: '/albums-index-cate-23.html', script: 'gen.js' },
    { title: '3D&漫画-其他', input: '/albums-index-cate-24.html', script: 'gen.js' },
    { title: 'AI图集', input: '/albums-index-cate-37.html', script: 'gen.js' },
    { title: '未分類相冊', input: '/albums-index-cate-0.html', script: 'gen.js' }
  ]);
}
