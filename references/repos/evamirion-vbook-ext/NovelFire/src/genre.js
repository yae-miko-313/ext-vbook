load('config.js');

function execute(url, page) {
    let response = fetch(BASE_URL+"/genre-all/sort-new/status-all/all-novel");
    if (response.ok) {
        let doc = response.html();
        const data = [];
		doc.select("ul.action-list li a").forEach(e => {
            data.push({ 
                    title: e.select("a").text(), 
                    input: e.select("a").attr("href"),
                    script: "gen.js" 
                })
        });
        return Response.success(data);
    }
    return null;
}