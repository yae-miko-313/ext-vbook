function execute() {
    return Response.success([
        { "input": "/manga-genre/18/", "title": "18+", "script": "gen.js" },
        { "input": "/manga-genre/bl-manhwa/", "title": "BL Manhwa", "script": "gen.js" },
        { "input": "/manga-genre/hien-dai/", "title": "Hiện đại", "script": "gen.js" }
    ]);
}