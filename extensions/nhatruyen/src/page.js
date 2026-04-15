load('config.js');

// page.js - returns list of page URLs for TOC pagination
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    
    var response = fetch(url);
    if (!response.ok) return Response.error("Cannot load");
    
    var doc = response.text();
    var match = doc.match(/postid-(\d+)/);
    var parentId = match ? match[1] : null;
    
    if (!parentId) {
        return Response.error("Cannot find parentId");
    }
    
    // Return API URLs for each page
    var pages = [];
    for (var i = 1; i <= 14; i++) {
        pages.push(BASE_URL + "/wp-admin/admin-ajax.php?page=" + i + "&parent_id=" + parentId);
    }
    
    return Response.success(pages);
}