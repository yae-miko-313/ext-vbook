load("config.js");

function buildDescription(item) {
  var text = "";

  if (item && item.content && item.content.rendered) {
    text = stripHtml(item.content.rendered);
  } else if (item && item.excerpt && item.excerpt.rendered) {
    text = stripHtml(item.excerpt.rendered);
  }

  text = cleanText(text);
  if (!text) {
    return "";
  }

  return text;
}

function execute(url) {
  var slug = getSlugFromUrl(url);
  
  var detailUrl = API_URL + "/wp/v2/manga?slug=" + slug + "&_embed=wp:featuredmedia,author,wp:term";
  var response = fetchApi(detailUrl);
  if (!response.ok) {
    return Response.error("Lỗi tải chi tiết truyện: " + response.status);
  }

  var data = response.json();
  if (!Array.isArray(data) || data.length === 0) {
    return Response.error("Không tìm thấy truyện");
  }

  var item = data[0];
  var coverUrl = extractCoverUrl(item);
  var authorName = extractAuthorName(item);

  var description = buildDescription(item);

  var genres = [];
  var genreTexts = [];
  var terms = collectTerms(item, ["genre", "category"]);
  for (var i = 0; i < terms.length; i++) {
    var term = terms[i];
    genres.push({
      title: term.name,
      input: API_URL + "/wp/v2/manga?genre=" + term.id + "&per_page=20&_embed=wp:featuredmedia,author,wp:term",
      script: "gen.js"
    });
    genreTexts.push(term.name);
  }

  var mangaStatus = item.manga_status ? String(item.manga_status).toLowerCase() : "";
  var statusText = "Đang ra";
  var isOngoing = false;

  if (mangaStatus === "ongoing") {
    statusText = "Đang ra";
    isOngoing = true;
  } else if (mangaStatus === "completed") {
    statusText = "Hoàn thành";
  } else if (mangaStatus === "hiatus") {
    statusText = "Tạm ngưng";
  } else if (mangaStatus === "cancelled") {
    statusText = "Đã hủy";
  } else if (mangaStatus) {
    statusText = mangaStatus;
  }

  var viewCount = "";
  if (item.views !== undefined && item.views !== null) {
    var views = Math.max(0, item.views);
    viewCount = "<p><strong>Lượt xem:</strong> " + views.toLocaleString() + "</p>";
  }

  var detailInfo = "<p><strong>Tác giả:</strong> " + authorName + "</p>" +
                   (genreTexts.length > 0 ? "<p><strong>Thể loại:</strong> " + genreTexts.join(", ") + "</p>" : "") +
                   "<p><strong>Trạng thái:</strong> " + statusText + "</p>" +
                   viewCount;

  return Response.success({
    name: getTitleText(item),
    cover: coverUrl,
    host: BASE_URL,
    author: authorName,
    status: statusText,
    description: description,
    detail: detailInfo,
    ongoing: isOngoing,
    genres: genres,
    link: url
  });
}

