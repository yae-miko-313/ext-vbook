load("config.js");

function execute() {
  return Response.success([
    {
      title: "Xem nhiều trong tuần",
      input: API_URL + "/initmanga/v1/ranking?tab=views&range=week&limit=50",
      script: "gen.js"
    },
    {
      title: "Truyện mới cập nhật",
      input: API_URL + "/wp/v2/manga?orderby=modified&order=desc&per_page=20&_embed=wp:featuredmedia,author,wp:term&page=",
      script: "gen.js"
    },
    {
      title: "Truyện đã hoàn thành",
      input: API_URL + "/wp/v2/manga?orderby=modified&order=desc&per_page=20&_embed=wp:featuredmedia,author,wp:term&manga_status=completed&page=",
      script: "gen.js"
    }
  ]);
}
