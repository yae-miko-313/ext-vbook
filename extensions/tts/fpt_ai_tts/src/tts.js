load("voice_list.js");

function isValidVoice(voiceId) {
    var i;
    for (i = 0; i < voices.length; i++) {
        if (voices[i].id === voiceId) {
            return true;
        }
    }
    return false;
}

// sleep(ms) là hàm native của vBook JSBridge

/**
 * Parse danh sách API key từ chuỗi api_keys (mỗi dòng 1 key).
 * Lọc bỏ dòng trống và khoảng trắng.
 */
function parseKeyList() {
    if (typeof api_keys === "undefined" || !api_keys) {
        return [];
    }
    var raw = String(api_keys);
    var lines = raw.split(/[\r\n]+/);
    var result = [];
    var i;
    for (i = 0; i < lines.length; i++) {
        var key = lines[i].trim();
        if (key) {
            result.push(key);
        }
    }
    return result;
}

/**
 * Lấy index key hiện tại từ cache, tăng round-robin cho lần sau.
 */
function pickKeyIndex(totalKeys) {
    var CACHE_KEY = "fpt_tts_key_index";
    var idx = 0;
    try {
        var cached = cacheStorage.getItem(CACHE_KEY);
        if (cached !== null && cached !== undefined) {
            idx = parseInt(cached, 10) || 0;
        }
    } catch (e) {
        idx = 0;
    }
    if (idx < 0 || idx >= totalKeys) {
        idx = 0;
    }
    var next = (idx + 1) % totalKeys;
    try {
        cacheStorage.setItem(CACHE_KEY, String(next));
    } catch (e) {
    }
    return idx;
}

function cleanInput(text) {
    return (text || "")
        .replace(/[@^*()\\/\-_+=><"'\u201c\u201d\u3010\u3011]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Gọi FPT TTS API với 1 API key cụ thể.
 * Trả về asyncUrl nếu thành công, null nếu thất bại.
 */
function callFptApi(apiKey, cleanText, voice) {
    try {
        var ttsResponse = fetch("https://api.fpt.ai/hmi/tts/v5", {
            method: "POST",
            headers: {
                "api_key": apiKey,
                "voice": voice,
                "speed": "0",
                "format": "mp3",
                "Cache-Control": "no-cache"
            },
            body: cleanText
        });

        if (!ttsResponse.ok) {
            return null;
        }

        var ttsJson = ttsResponse.json();
        if (!ttsJson) {
            return null;
        }

        // Định dạng 1 (chính thức): error=0, link ở trường "async"
        if (ttsJson.error === 0 && ttsJson.async) {
            return ttsJson.async;
        }

        // Định dạng 2 (callback-style): success="true", link ở trường "message"
        if (typeof ttsJson.message === "string" && ttsJson.message.indexOf("http") === 0) {
            return ttsJson.message;
        }
    } catch (e) {
    }
    return null;
}

function execute(text, voice) {
    var cleanText = cleanInput(text);

    if (!cleanText) {
        return Response.error("Nội dung văn bản trống");
    }

    var keyList = parseKeyList();
    if (keyList.length === 0) {
        return Response.error("Thiếu API key FPT. Vui lòng nhập ít nhất 1 key trong phần cài đặt extension.");
    }

    var selectedVoice = isValidVoice(voice) ? voice : "banmai";

    // Chọn key theo round-robin, thử tất cả key nếu key đầu thất bại
    var startIdx = pickKeyIndex(keyList.length);
    var asyncUrl = null;
    var i;
    for (i = 0; i < keyList.length; i++) {
        var keyIdx = (startIdx + i) % keyList.length;
        asyncUrl = callFptApi(keyList[keyIdx], cleanText, selectedVoice);
        if (asyncUrl) {
            break;
        }
    }

    if (!asyncUrl) {
        return Response.error("Không lấy được liên kết audio từ FPT. Kiểm tra API key và kết nối mạng.");
    }

    // Poll async URL - tối đa 60 giây (40 lần x 1.5s)
    for (i = 0; i < 40; i++) {
        try {
            var audioResponse = fetch(asyncUrl);
            if (audioResponse.ok) {
                var base64Data = audioResponse.base64();
                if (base64Data && base64Data.length > 100) {
                    return Response.success(base64Data);
                }
            }
        } catch (e) {
        }
        sleep(1500);
    }

    return Response.error("Audio chưa sẵn sàng sau 60 giây. Vui lòng thử lại.");
}
