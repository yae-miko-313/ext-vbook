function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        
        // Chọn đúng thẻ chứa nội dung dựa theo HTML bạn cung cấp
        let el = doc.select(".chapter-content");
        
        // Dọn dẹp rác: xóa thẻ script, iframe, các khối quảng cáo
        el.select("script, iframe, style, .ads, .quang-cao").remove();
        
        // Thường các số rác (Không3biết) được web giấu trong các thẻ span/i bị ẩn đi
        // Dòng này sẽ xóa các thẻ bị làm mờ/ẩn để chữ hiển thị bình thường
        el.select('[style*="display:none"], [style*="display: none"], [style*="font-size:0"], [style*="font-size: 0"], [hidden]').remove();
        
        // Lấy nội dung HTML (đã bao gồm cả text và thẻ <img>)
        let content = el.html();
        
        // Lọc các ký tự tàng hình (Zero-width spaces) web hay dùng để chống copy
        content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
        
        // Chuẩn hóa lại các khoảng trắng và dấu ngắt dòng cho đẹp mắt trên app
        content = content.replace(/(<br\s*\/?>\s*){3,}/g, '<br><br>');
        
        return Response.success(content);
    }
    return null;
}