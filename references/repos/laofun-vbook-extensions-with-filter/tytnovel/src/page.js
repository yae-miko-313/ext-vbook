load("config.js");

function execute(url) {
  try {
    // Trích xuất story_id từ URL
    const sidMatch = url.match(/([a-z0-9]{24})/);
    if (!sidMatch) {
      return Response.error("Invalid URL: story_id not found");
    }
    const sid = sidMatch[1];

    // Gửi yêu cầu lấy chi tiết của câu chuyện
    const response = fetch(`${BASE_HOST}/api/v2/stories/${sid}/detail`, {
      method: 'GET',
      headers: {
        'client-id': 'simbo',
        'client-language': 'en',
        'client-platform': 'ios',
        'client-token': 'simbo',
        'client-version': BASE_VERSION,
      }
    });

    if (!response.ok) {
      return Response.error("Failed to fetch story details");
    }

    // Phân tích dữ liệu JSON từ phản hồi
    const data = response.json();
    const chapterCount = data.data.chapter_count;
    
    if (typeof chapterCount !== 'number' || chapterCount < 0) {
      return Response.error("Invalid chapter count");
    }

    const pages = [];
    const step = 100;
    // Tính tổng số trang (sử dụng Math.ceil để đảm bảo là số nguyên)
    const totalPages = Math.ceil(chapterCount / step);

    for (let i = 0; i < totalPages; i++) {
      var start = i * step + (i > 0 ? 1 : 0);
      // Đảm bảo rằng end không vượt quá tổng số chương
      var end = ((i + 1) * step);
      if (end > chapterCount) {
        end = chapterCount;
      }
      pages.push(`${BASE_HOST}/api/v2/chapters/numbers?story_id=${sid}&start=${start}&end=${end}`);
    }

    return Response.success(pages);
  } catch (error) {
    return Response.error("An unexpected error occurred: " + error.message);
  }
}
