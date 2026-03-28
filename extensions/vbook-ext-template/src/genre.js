function execute() {
    return Response.success([
        { title: 'Action', input: '/genre/action', script: 'gen.js' },
        { title: 'Romance', input: '/genre/romance', script: 'gen.js' },
        { title: 'Fantasy', input: '/genre/fantasy', script: 'gen.js' }
    ]);
}
