load("config.js");

function execute(url) {
  var response = fetchApi(url);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return Response.error("Chương này yêu cầu cấu hình Token App hợp lệ lấy từ bản Mod để giải mã đọc!");
    }
    return Response.error("Lỗi tải nội dung chương: " + response.status);
  }

  var data = response.json();
  
  if (!data) {
    return Response.error("Dữ liệu chương trống từ server.");
  }

  if (data.lock_type && data.lock_type !== "none") {
    var lockMsg = "Chương này đang bị khóa";
    if (data.lock_type === "premium" || data.lock_type === "pay") {
      lockMsg += ". Cần mua chương trong app.";
    } else if (data.lock_type === "login") {
      lockMsg += ". Cần đăng nhập để xem.";
    } else {
      lockMsg += ".";
    }
    return Response.error(lockMsg);
  }

  var htmlContent = "";
  if (data && data.content) {
    if (typeof data.content === "string") {
      htmlContent = data.content;
    } else if (typeof data.content === "object" && data.content.rendered) {
      htmlContent = data.content.rendered;
    }
  } else if (data && data.post_content) {
    htmlContent = String(data.post_content);
  } else if (data && typeof data === "string") {
    htmlContent = data;
  }

  if (!htmlContent || htmlContent.trim() === "") {
    return Response.error("Nội dung chương trống. Vui lòng thử lại sau.");
  }

  return Response.success(htmlContent);
}
