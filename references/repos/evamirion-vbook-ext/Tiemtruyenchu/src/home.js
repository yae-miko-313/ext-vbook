function execute() {
    return Response.success([
        {title: "Truyện dịch", input:  "?type=truyen-dich", script: "gen.js"},
        {title: "Truyện Convert", input:  "?type=truyen-cv", script: "gen.js"},
        {title: "Truyện sáng tác", input:  "?type=sang-tac", script: "gen.js"},
        {title: "Truyện cho Nữ", input:  "?gender=nu", script: "gen.js"},
        {title: "Truyện cho Nam", input:  "?gender=nam", script: "gen.js"},
    ]);
}