function execute() {
    return Response.success([
        { title: "Truyện Hot", input: "https://metruyencv.xyz/?m_orderby=views", script: "gen.js" },
        { title: "Truyện Full", input: "https://metruyencv.xyz/?s&post_type=wp-manga&status%5B0%5D=end&m_orderby=latest", script: "gen.js" },
        { title: "Truyện Mới", input: "https://metruyencv.xyz/?m_orderby=new-manga", script: "gen.js" },
    ]);
}