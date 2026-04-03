load("config.js");

function execute(url) {
  try {
    // Trích xuất story_id từ URL
    const sid = normalizeStoryId(url);
    if (!sid) {
      return Response.error("Invalid URL: story_id not found");
    }

    // Gửi yêu cầu lấy chi tiết của câu chuyện
    const result = apiFetch(`stories/${sid}/detail`);
    if (!result.ok) {
      return errorFromApiResult("Tai trang muc luc", result);
    }

    // Phân tích dữ liệu JSON từ phản hồi
    const data = result.response.json();
    const chapterCount = data.data.chapter_count;
    
    if (typeof chapterCount !== 'number' || chapterCount < 0) {
      return Response.error("Invalid chapter count");
    }

    const pages = [];
    const step = 100;
    // Tính tổng số trang (sử dụng Math.ceil để đảm bảo là số nguyên)
    const totalPages = Math.ceil(chapterCount / step);
    const activeHost = result.host;

    for (let i = 0; i < totalPages; i++) {
      var start = i * step + (i > 0 ? 1 : 0);
      // Đảm bảo rằng end không vượt quá tổng số chương
      var end = ((i + 1) * step);
      if (end > chapterCount) {
        end = chapterCount;
      }
      pages.push(`${getApiUrl('chapters/numbers', activeHost)}?story_id=${encodeURIComponent(sid)}&start=${start}&end=${end}`);
    }

    return Response.success(pages);
  } catch (error) {
    return Response.error("An unexpected error occurred: " + error.message);
  }
}
