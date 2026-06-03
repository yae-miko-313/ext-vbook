function execute(url) {
    const BASE_COOKIE = "_ga_4BC3P9JVX3=GS1.1.1733504363.1.0.1733504363.60.0.1941970943; _ga=GA1.1.1575844443.1733504364; _ga_EDY4YZ85BM=GS1.1.1733504364.1.0.1733504365.0.0.0; token=eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MTAzMzA5NTA4MDEyNDIyMzQ4OCwidHlwZSI6ImN1c3RvbWVyIiwidGltZXN0YW1wIjoxNzMzNTA0NDMyMTE0LCJleHAiOjE3MzQxMDkyMzJ9.D6Q8g6FlQ8ivByJpPUWrtldU-vU1hNb-5Dv9Bu0R3h4";
    let body = {
        method: "POST",
        headers: {
            "cookie": BASE_COOKIE,
            "User-Agent": UserAgent.android()
        }
    };

    let response = fetch(url, body);

    if (response.ok) {
        let doc = response.html();
        let content = "";
        console.log(doc);
        doc.select(".line").forEach(e => {
            content += e.text() + "<br>";
        });

        return Response.success(content);
    }
    return null;
}