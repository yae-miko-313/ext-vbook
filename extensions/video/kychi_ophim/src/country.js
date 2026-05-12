function execute() {
    var response = fetch("https://ophim1.com/v1/api/quoc-gia");
    if (response.ok) {
        var resJson = response.json();
        var items = resJson.data.items;
        var data = [];
        
        if (items) {
            items.forEach(function (item) {
                data.push({
                    title: item.name,
                    input: "https://ophim1.com/v1/api/quoc-gia/" + item.slug,
                    script: "gen.js"
                });
            });
        }
        return Response.success(data);
    }
    return null;
}
