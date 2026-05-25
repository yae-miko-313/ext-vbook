var BASE_URL = "https://truyencv.io";
var API_URL = "https://truyencv.io/wp-json";

function getToken() {
  try {
    if (typeof USER_TOKEN !== "undefined" && USER_TOKEN) {
      return USER_TOKEN;
    }
  } catch (e) {}
  return "";
}

function fetchApi(url, options) {
  if (!options) options = {};

  var headers = {
    "User-Agent": "Dart/3.11 (dart:io)",
    "Content-Type": "application/json"
  };

  var token = getToken();
  if (token) {
    headers["Authorization"] = token.indexOf("Bearer") === 0 ? token : "Bearer " + token;
  }

  if (options.headers) {
    for (var key in options.headers) {
      headers[key] = options.headers[key];
    }
  }

  options.headers = headers;
  return fetch(url, options);
}

function cleanText(text) {
  if (text === undefined || text === null) {
    return "";
  }
  return String(text).replace(/\s+/g, " ").trim();
}

function stripHtml(html) {
  if (html === undefined || html === null) {
    return "";
  }
  return cleanText(String(html).replace(/<[^>]*>/g, " "));
}

function getSlugFromUrl(url) {
  if (!url) return "";
  var cleanUrl = String(url).replace(/[?#].*$/, "").replace(/\/+$/, "");
  var parts = cleanUrl.split("/");
  return parts[parts.length - 1];
}

function getTitleText(item) {
  if (!item || !item.title) return "";
  if (typeof item.title === "string") {
    return cleanText(item.title);
  }
  if (item.title.rendered) {
    return stripHtml(item.title.rendered);
  }
  return cleanText(item.title);
}

function extractCoverUrl(item) {
  if (!item) return "";

  if (item._embedded && item._embedded["wp:featuredmedia"] && item._embedded["wp:featuredmedia"][0]) {
    return item._embedded["wp:featuredmedia"][0].source_url || "";
  }

  return item.cover || "";
}

function collectTerms(item, taxonomies) {
  var list = [];
  if (!item || !item._embedded || !item._embedded["wp:term"]) {
    return list;
  }

  var groups = item._embedded["wp:term"];
  for (var i = 0; i < groups.length; i++) {
    var termGroup = groups[i];
    if (!Array.isArray(termGroup)) {
      continue;
    }

    for (var j = 0; j < termGroup.length; j++) {
      var term = termGroup[j];
      if (taxonomies && taxonomies.length > 0 && taxonomies.indexOf(term.taxonomy) === -1) {
        continue;
      }
      list.push(term);
    }
  }

  return list;
}

function extractAuthorName(item) {
  var authorTerms = collectTerms(item, ["author_tax"]);
  if (authorTerms.length > 0 && authorTerms[0].name) {
    return authorTerms[0].name;
  }

  if (item && item._embedded && item._embedded.author && item._embedded.author[0]) {
    return item._embedded.author[0].name || "Đang cập nhật";
  }

  if (item && typeof item.author === "string" && cleanText(item.author)) {
    return cleanText(item.author);
  }

  if (item && item.author && typeof item.author.name === "string" && cleanText(item.author.name)) {
    return cleanText(item.author.name);
  }

  return "Đang cập nhật";
}

function parseApiList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.chapters)) {
    return data.chapters;
  }
  if (data && Array.isArray(data.results)) {
    return data.results;
  }
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  if (data && Array.isArray(data.items)) {
    return data.items;
  }
  return [];
}

function buildMangaLink(slug) {
  return BASE_URL + "/truyen/" + slug + "/";
}

var Response = {
  success: function(data, data2) {
    return JSON.stringify({ code: 0, data: data, data2: data2 });
  },
  error: function(data) {
    return JSON.stringify({ code: 1, data: data });
  }
};
