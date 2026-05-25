load("config.js");

function execute(input) {
  var mangaId = "";
  
  if (input && /^\d+$/.test(String(input).trim())) {
    mangaId = String(input).trim();
  } else {
    var slug = getSlugFromUrl(input);
    if (!slug) {
      return Response.error("Đường dẫn truyện không hợp lệ: " + input);
    }
    
    var detailUrl = API_URL + "/wp/v2/manga?slug=" + slug;
    var response = fetchApi(detailUrl);
    if (!response.ok) {
      return Response.error("Lỗi lấy ID truyện để tải chương: " + response.status);
    }
    
    var data = response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return Response.error("Không tìm thấy thông tin truyện để tải chương.");
    }
    
    mangaId = String(data[0].id);
  }

  var allChapters = [];
  var orderIndex = 0;
  var page = 1;
  var limit = 50;
  var chapterListBaseUrl = API_URL + "/initmanga/v1/chapters?manga_id=" + mangaId;
  
  while (true) {
    var tocUrl = chapterListBaseUrl + "&paged=" + page + "&per_page=" + limit;
    var response = fetchApi(tocUrl);
    if (!response.ok) {
      if (page === 1) {
        if (response.status === 401 || response.status === 403) {
          return Response.error("Yêu cầu cấu hình Token App lấy từ bản Mod trong cài đặt tiện ích để tải mục lục chương!");
        }
        return Response.error("Lỗi tải mục lục chương: " + response.status);
      }
      break;
    }
    
    var data = response.json();
    var items = parseApiList(data);
    
    if (items.length === 0) {
      break;
    }
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var rawNumber = item && item.number !== undefined && item.number !== null ? String(item.number) : "?";
      var rawTitle = item && item.title ? String(item.title) : "";
      var chapterName = "Chương " + rawNumber + " : " + rawTitle;
      var chapterNo = Number(item.number);
      if (isNaN(chapterNo)) {
        chapterNo = null;
      }

      allChapters.push({
        name: chapterName,
        url: API_URL + "/initmanga/v1/chapter/" + item.id,
        host: BASE_URL,
        _chapterNo: chapterNo,
        _order: orderIndex
      });
      orderIndex++;
    }
    
    if (items.length < limit) {
      break;
    }
    page++;
    
    if (page > 100) {
      break;
    }
  }

  if (allChapters.length === 0) {
    return Response.error("Không có chương nào được tải.");
  }

  allChapters.sort(function(a, b) {
    if (a._chapterNo !== null && b._chapterNo !== null && a._chapterNo !== b._chapterNo) {
      return a._chapterNo - b._chapterNo;
    }
    if (a._chapterNo === null && b._chapterNo !== null) {
      return 1;
    }
    if (a._chapterNo !== null && b._chapterNo === null) {
      return -1;
    }
    return a._order - b._order;
  });

  for (var j = 0; j < allChapters.length; j++) {
    delete allChapters[j]._chapterNo;
    delete allChapters[j]._order;
  }

  return Response.success(allChapters);
}

