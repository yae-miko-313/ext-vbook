function pad2(n) {
  n = parseInt(n, 10);
  if (isNaN(n) || n < 0) n = 0;
  var s = n + '';
  while (s.length < 2) s = '0' + s;
  return s;
}

function albumPathFromAid(aid) {
  var aidNum = parseInt(aid, 10);
  if (isNaN(aidNum) || aidNum < 1) return '';
  return '/data/' + Math.floor(aidNum / 100) + '/' + pad2(aidNum % 100) + '/';
}

function toHttps(url) {
  url = (url || '') + '';
  return url.replace(/^http:\/\//i, 'https://');
}

function pushImage(url, albumPath, out, seen) {
  url = ((url || '') + '').replace(/\\\//g, '/');
  if (!url) return;

  url = toAbsoluteUrl(url);
  if (!/^https?:\/\/(?:img|t)\d+\.qy0\.ru\/data\/\d+\/\d+\/\d+(?:_[^\/.?#]+)?\.(?:jpe?g|png|webp|gif)(?:\?[^#]*)?$/i.test(url)) return;
  if (albumPath && url.indexOf(albumPath) === -1) return;

  url = toHttps(url);
  if (seen[url]) return;
  seen[url] = true;
  out.push(url);
}

function parseFromItemResponse(raw, albumPath, out, seen) {
  raw = (raw || '') + '';

  var jsonMatch = raw.match(/initData\((\{[\s\S]*?\})\)\s*;?/i);
  if (jsonMatch) {
    try {
      var jsonText = jsonMatch[1].replace(/,\s*([}\]])/g, '$1');
      var initData = JSON.parse(jsonText);
      var pageUrls = initData && initData.page_url ? initData.page_url : null;
      if (pageUrls && pageUrls.length) {
        pageUrls.forEach(function(u) {
          pushImage(u, albumPath, out, seen);
        });
      }
    } catch (e) {
    }
  }

  if (out.length > 0) return;

  var re = /(?:https?:)?\/\/(?:img|t)\d+\.qy0\.ru\/data\/\d+\/\d+\/\d+(?:_[^\/.?#]+)?\.(?:jpe?g|png|webp|gif)(?:\?[^"'\s<>]*)?/ig;
  var m;
  while ((m = re.exec(raw)) !== null) {
    pushImage(m[0], albumPath, out, seen);
  }
}

function pageNo(url) {
  var m = ((url || '') + '').match(/\/(\d+)(?:_[^\/.?#]+)?\.(?:jpe?g|png|webp|gif)(?:\?|$)/i);
  if (!m) return 99999;
  var n = parseInt(m[1], 10);
  return isNaN(n) ? 99999 : n;
}

function removeLeadingPageZero(images) {
  if (!images || images.length < 2) return images;
  var first = pageNo(images[0]);
  var second = pageNo(images[1]);
  if (first === 0 && second === 1) return images.slice(1);
  return images;
}

function getImages(aid) {
  var itemUrl = BASE_URL + '/photos-item-aid-' + aid + '.html';
  var itemRes = fetch(itemUrl, { method: 'GET' });
  if (!itemRes.ok) return null;

  var albumPath = albumPathFromAid(aid);
  var images = [];
  var seen = {};
  parseFromItemResponse(itemRes.text(), albumPath, images, seen);

  images.sort(function(a, b) {
    return pageNo(a) - pageNo(b);
  });
  return removeLeadingPageZero(images);
}
