let BASE_URL = "https://www.wnacg.com";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

function toAbsoluteUrl(u) {
  u = (u || "") + "";
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (/^\/\//.test(u)) return "https://" + u.replace(/^\/+/, "");
  if (/^\/+/.test(u)) return BASE_URL + "/" + u.replace(/^\/+/, "");
  return BASE_URL + "/" + u.replace(/^\/+/, "");
}

function normalizePathOrUrl(input) {
  input = (input || "") + "";
  if (!input) return "/";
  if (/^https?:\/\//i.test(input)) {
    input = input.replace(/^(?:https?:\/\/)?(?:www\.)?wnacg\.(?:com|ru)/i, BASE_URL);
    input = input.replace(BASE_URL, "");
  }
  if (input.charAt(0) !== "/") input = "/" + input;
  return input;
}

function parseAid(url) {
  var m = ((url || "") + "").match(/aid-(\d+)\.html/i);
  return m ? m[1] : "";
}

function firstAttr(el, names) {
  if (!el) return "";
  for (var i = 0; i < names.length; i++) {
    var v = (el.attr(names[i]) || "") + "";
    if (v) return v;
  }
  return "";
}

function textOf(el) {
  return el ? ((el.text() || "") + "") : "";
}

function cleanInlineTags(v) {
  return ((v || "") + "").replace(/<em[^>]*>/g, "").replace(/<\/em>/g, "");
}

function normalizeBookLinkForOutput(link) {
  return normalizePathOrUrl(link).replace(BASE_URL, "");
}

function isGalleryImage(url) {
  url = (url || "") + "";
  if (!url) return false;
  if (url.indexOf('/data/t/') === -1) return false;
  if (url.indexOf('mc.yandex.ru') > -1) return false;
  return true;
}
