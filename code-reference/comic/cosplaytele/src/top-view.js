load('config.js');

function execute(url, page) {
    // mark params as used to satisfy linters
    if (url || page) {}

    // Top view is a single, non-paginated section on home page
    var response = fetch(BASE_URL + '/', { method: 'GET' });
    if (!response.ok) return Response.error('Failed to load top view');

    var doc = response.html();
    var data = [];

    // Prefer the slider right after the "Popular Cosplay" section title
    var slider = doc.select('div.section-title-container:has(.section-title-main:matchesOwn(Popular\\s+Cosplay)) + div.slider').first();

    // Fallback: any slider block (take the first one)
    if (!slider) slider = doc.select('div.slider').first();

    if (slider) {
        slider.select('.col.post-item').forEach(function (e) {
            var a = e.select('.post-title a').first();
            if (!a) a = e.select('.box-image a').first();
            if (!a) return;
            var name = a.text();
            var link = a.attr('href');
            if (link) link = link.replace(BASE_URL, '');
            var img = e.select('.box-image img').first();
            var cover = img ? (img.attr('src') || img.attr('data-src') || img.attr('data-original')) : '';
            data.push({ name: name, link: link, cover: cover });
        });
    }

    if (data.length === 0) return Response.error('No items found in top view');

    // No pagination for top view
    return Response.success(data);
}
