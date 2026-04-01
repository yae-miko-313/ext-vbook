load("config.js");

var AI_MAX_RETRIES = 3;

function execute(url) {
    if (typeof Engine === "undefined" || !Engine || typeof Engine.newBrowser !== "function") {
        return fetchFallback(url);
    }

    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 20000);

        var translators = [];
        for (var tw = 0; tw < 8; tw++) {
            sleep(2000);
            var transKey = "__wtd_t_" + Math.random().toString(36).substring(2);
            browser.callJs("try{"
                + "var opts=document.querySelectorAll('#translator option');"
                + "var arr=[];for(var i=0;i<opts.length;i++){arr.push(opts[i].value);}"
                + "Cache.putVariable('" + transKey + "',JSON.stringify(arr));"
                + "}catch(e){Cache.putVariable('" + transKey + "','[]');}", 3000);
            try { translators = JSON.parse(browser.getVariable(transKey)); } catch (e) { }
            if (translators.length > 0) break;
        }

        var aiEngines = sortAiEngines(translators);
        var content = "";
        var maxRetries = Math.min(aiEngines.length, AI_MAX_RETRIES);

        for (var idx = 0; idx < maxRetries; idx++) {
            if (idx === 1) {
                aiEngines = reorderNoApikey(aiEngines);
            }
            var translator = aiEngines[idx];
            var selectKey = "__wtd_s_" + Math.random().toString(36).substring(2);
            browser.callJs("try{"
                + "var sel=document.getElementById('translator');"
                + "if(sel){sel.value=" + JSON.stringify(translator) + ";"
                + "sel.dispatchEvent(new Event('change',{bubbles:true}));"
                + "Cache.putVariable('" + selectKey + "','ok');}"
                + "else{Cache.putVariable('" + selectKey + "','no');}"
                + "}catch(e){Cache.putVariable('" + selectKey + "','err');}", 3000);
            if (browser.getVariable(selectKey) !== "ok") continue;

            var aiContent = waitForContent(browser, 90);
            if (isValidContent(aiContent)) {
                content = aiContent;
                break;
            }
        }

        if (!isValidContent(content)) {
            var vpKey = "__wtd_vp_" + Math.random().toString(36).substring(2);
            browser.callJs("try{"
                + "var sel=document.getElementById('translator');"
                + "if(sel){sel.value='Vietphrase';"
                + "sel.dispatchEvent(new Event('change',{bubbles:true}));"
                + "Cache.putVariable('" + vpKey + "','ok');}"
                + "else{Cache.putVariable('" + vpKey + "','no');}"
                + "}catch(e){Cache.putVariable('" + vpKey + "','err');}", 3000);
            var vpContent = waitForContent(browser, 30);
            if (isValidContent(vpContent)) content = vpContent;
        }

        if (!isValidContent(content)) {
            content = getArticleContent(browser);
        }

        browser.close();
        browser = null;

        if (isValidContent(content)) return Response.success(cleanContent(content));
        return fetchFallback(url);
    } catch (e) {
        if (browser) try { browser.close(); } catch (e2) { }
        return fetchFallback(url);
    }
}

function sortAiEngines(translators) {
    var ai = [];
    for (var i = 0; i < translators.length; i++) {
        if (translators[i] && translators[i].toLowerCase().indexOf("ai") >= 0) {
            ai.push(translators[i]);
        }
    }
    if (!AI_PRIORITY) return ai;
    var priority = AI_PRIORITY.toLowerCase();
    ai.sort(function (a, b) {
        var aMatch = a.toLowerCase().indexOf(priority) >= 0 ? 0 : 1;
        var bMatch = b.toLowerCase().indexOf(priority) >= 0 ? 0 : 1;
        return aMatch - bMatch;
    });
    return ai;
}

function reorderNoApikey(engines) {
    var front = [engines[0]];
    var noKey = [];
    var rest = [];
    for (var i = 1; i < engines.length; i++) {
        if (engines[i].toLowerCase().indexOf("no apikey") >= 0) {
            noKey.push(engines[i]);
        } else {
            rest.push(engines[i]);
        }
    }
    return front.concat(noKey).concat(rest);
}

function waitForContent(browser, maxWaitSeconds) {
    var maxChecks = Math.ceil((maxWaitSeconds * 1000) / 2000);
    var lastLength = 0;
    var stableCount = 0;
    var content = "";

    for (var i = 0; i < maxChecks; i++) {
        sleep(2000);
        var ck = "__wtd_ck_" + Math.random().toString(36).substring(2);
        browser.callJs("try{"
            + "var art=document.getElementById('article');"
            + "var ld=document.querySelector('.stream-spinner,.loading-spinner,#loading-indicator');"
            + "var t=art?art.innerText:'';"
            + "var h=art?art.innerHTML:'';"
            + "Cache.putVariable('" + ck + "',JSON.stringify({l:!!ld,t:t.length,h:h.length,html:h}));"
            + "}catch(e){Cache.putVariable('" + ck + "','');}", 5000);
        var raw = browser.getVariable(ck);
        if (!raw) continue;

        var info = {};
        try { info = JSON.parse(raw); } catch (e) { continue; }
        var currentLen = info.t || 0;

        if (!info.l && currentLen > 50) {
            sleep(2000);
            var fk = "__wtd_f_" + Math.random().toString(36).substring(2);
            browser.callJs("try{"
                + "var art=document.getElementById('article');"
                + "Cache.putVariable('" + fk + "',art?art.innerHTML:'');"
                + "}catch(e){Cache.putVariable('" + fk + "','');}", 5000);
            content = browser.getVariable(fk) || info.html || "";
            content = content ? "" + content : "";
            break;
        }

        if (currentLen > 50 && currentLen === lastLength) {
            stableCount++;
            if (stableCount >= 3) {
                content = info.html || "";
                content = content ? "" + content : "";
                break;
            }
        } else {
            stableCount = 0;
        }
        lastLength = currentLen;
    }

    return content ? "" + content : "";
}

function getArticleContent(browser) {
    var ak = "__wtd_ga_" + Math.random().toString(36).substring(2);
    browser.callJs("try{"
        + "var art=document.getElementById('article');"
        + "Cache.putVariable('" + ak + "',art?art.innerHTML:'');"
        + "}catch(e){Cache.putVariable('" + ak + "','');}", 5000);
    var c = browser.getVariable(ak);
    return c ? "" + c : "";
}

function isValidContent(text) {
    if (!text || ("" + text).replace(/\s/g, "").length < 50) return false;
    var lower = ("" + text).toLowerCase();
    if (lower.indexOf("mô hình ai hiện đang quá tải") >= 0) return false;
    if (lower.indexOf("vui lòng thử lại sau") >= 0) return false;
    if (lower.indexOf("stream-spinner") >= 0) return false;
    if (lower.indexOf("captcha required") >= 0) return false;
    if (lower.indexOf("captcha") >= 0 && lower.indexOf("verification") >= 0) return false;
    if (lower.indexOf("cloudflare") >= 0) return false;
    if (lower.indexOf("just a moment") >= 0) return false;
    if (lower.indexOf("ai loading") >= 0 && lower.length < 200) return false;
    var trimmed = ("" + text).replace(/^\s+|\s+$/g, "");
    if (trimmed.charAt(0) === '{' && trimmed.indexOf('"detail"') >= 0) return false;
    return true;
}

function cleanContent(text) {
    var s = "" + text;
    s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    s = s.replace(/<ins[^>]*>[\s\S]*?<\/ins>/gi, '');
    s = s.replace(/<\/?(p|div|article|section|h[1-6]|blockquote|li|tr|ul|ol)[^>]*>/gi, '\n');
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<[^>]+>/g, '');
    s = s.replace(/&nbsp;/gi, ' ');
    s = s.replace(/&quot;/gi, '"');
    s = s.replace(/&#39;/gi, "'");
    s = s.replace(/&lt;/gi, '<');
    s = s.replace(/&gt;/gi, '>');
    s = s.replace(/&amp;/gi, '&');
    s = s.replace(/[ \t]+/g, ' ');
    s = s.replace(/ *\n */g, '\n');
    s = s.replace(/\n{3,}/g, '\n\n');
    s = s.replace(/^\s+|\s+$/g, '');
    return s.replace(/\n/g, '<br>');
}

function fetchFallback(url) {
    try {
        var response = fetch(url);
        if (!response || !response.ok) return Response.error("Lỗi kết nối.");

        var html = response.text();
        var getVar = function (regex) {
            var match = html.match(regex);
            return match ? match[1] : "";
        };

        var payload = {
            chapter_id: getVar(/chapter_id\s*=\s*["'](\d+)["']/),
            novel_id: getVar(/novel_id\s*=\s*["'](\d+)["']/),
            source_name: getVar(/source_name\s*=\s*["']([^"']+)["']/) || "69shuba",
            source_id: getVar(/sourceId\s*=\s*["'](\d+)["']/),
            chapter_url: getVar(/chapterUrl\s*=\s*["']([^"']+)["']/),
            novel_url: getVar(/novel_url\s*=\s*["']([^"']+)["']/),
            translator: "Vietphrase"
        };

        var apiRes = fetch(BASE_URL + "/api/getChapter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (apiRes && apiRes.ok) {
            var raw = apiRes.text();
            if (raw) {
                try {
                    var json = JSON.parse(raw);
                    var content = json.content || json.data || "";
                    if (isValidContent(content)) return Response.success(cleanContent(content));
                } catch (e) {
                    if (isValidContent(raw)) return Response.success(cleanContent(raw));
                }
            }
        }

        var doc = response.html();
        if (doc) {
            var article = doc.select("#article").first();
            if (article) {
                var hc = "" + article.html();
                if (isValidContent(hc)) return Response.success(cleanContent(hc));
            }
        }
    } catch (e) { }
    return Response.error("Không lấy được nội dung chương.");
}