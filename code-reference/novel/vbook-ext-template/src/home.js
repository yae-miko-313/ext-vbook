function execute() {
    return Response.success([
        { title: 'Latest', input: '/novel/latest', script: 'gen.js' },
        { title: 'Popular', input: '/novel/popular', script: 'gen.js' },
        { title: 'Completed', input: '/novel/completed', script: 'gen.js' }
    ]);
}
