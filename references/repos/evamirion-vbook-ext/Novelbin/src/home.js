function execute() {
    return Response.success([
        { title: "Latest", input: "https://novelbin.me/sort/novelbin-daily-update?page=", script: "gen.js" },
        { title: "Hot Novel", input: "https://novelbin.me/sort/novelbin-hot?page=", script: "gen.js" }, 
        { title: "Compelete", input: "https://novelbin.me/sort/novelbin-complete?page=", script: "gen.js" }, 
        { title: "Most popular", input: "https://novelbin.me/sort/novelbin-popular?page=", script: "gen.js" }, 
    ]);
}