let BASE_URL = "https://tytnovel.org";
let BASE_API_HOSTS = [
    "https://tata.noveltyt.app",
    "https://api.noveltyt.app"
];
let BASE_API_VERSION = "v2";
let BASE_CLIENT_ID = "tata";
let BASE_CLIENT_TOKEN = "tata";
let BASE_VERSION = "65";
let BASE_PLATFORM = "android";
let BASE_LANGUAGE = "vi";
let BASE_UUID = "";
let AUTH_MODE = "app";
let USER_COOKIE = "";
let USER_AUTHORIZATION = "";
let USER_HEADERS = "";

function getClientUuid() {
    if (BASE_UUID) {
        return BASE_UUID;
    }
    BASE_UUID = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    return BASE_UUID;
}

function parseUserHeaders(rawHeaders) {
    const parsed = {};
    if (!rawHeaders || typeof rawHeaders !== "string") {
        return parsed;
    }
    rawHeaders.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            return;
        }
        const separatorIndex = trimmed.indexOf(":");
        if (separatorIndex <= 0) {
            return;
        }
        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();
        if (key && value) {
            parsed[key] = value;
        }
    });
    return parsed;
}

function getApiHeaders() {
    const headers = {
        "client-id": BASE_CLIENT_ID,
        "client-token": BASE_CLIENT_TOKEN,
        "client-platform": BASE_PLATFORM,
        "client-version": BASE_VERSION,
        "client-language": BASE_LANGUAGE,
        "client-uuid": getClientUuid()
    };

    if (AUTH_MODE === "user") {
        if (USER_COOKIE) {
            headers["cookie"] = USER_COOKIE;
        }
        if (USER_AUTHORIZATION) {
            headers["authorization"] = USER_AUTHORIZATION;
        }
        const extraHeaders = parseUserHeaders(USER_HEADERS);
        Object.keys(extraHeaders).forEach(key => {
            headers[key] = extraHeaders[key];
        });
    }

    return headers;
}

function getApiUrl(path, host) {
    const baseHost = host || BASE_API_HOSTS[0];
    return `${baseHost}/api/${BASE_API_VERSION}/${path}`;
}

function buildQuery(params) {
    if (!params) {
        return "";
    }
    const keys = Object.keys(params);
    if (!keys.length) {
        return "";
    }
    const query = keys
        .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== "")
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
        .join("&");
    return query ? `?${query}` : "";
}

function apiFetch(path, params) {
    const headers = getApiHeaders();
    let lastResponse = null;
    let lastError = null;
    let lastUrl = "";

    for (let i = 0; i < BASE_API_HOSTS.length; i++) {
        const host = BASE_API_HOSTS[i];
        const url = `${getApiUrl(path, host)}${buildQuery(params)}`;
        lastUrl = url;
        try {
            const response = fetch(url, {
                method: "GET",
                headers: headers
            });
            if (response && response.ok) {
                return {
                    ok: true,
                    response: response,
                    host: host,
                    url: url
                };
            }
            lastResponse = response;
        } catch (error) {
            lastError = error;
        }
    }

    return {
        ok: false,
        response: lastResponse,
        error: lastError,
        url: lastUrl
    };
}

function buildAuthHelpMessage(action) {
    const failAction = action || "Yeu cau";
    return `${failAction} that bai (403/401). Neu ban dang dung tai khoan ca nhan, hay cau hinh mode user:\n` +
        `- CONFIG_AUTH_MODE = \"user\"\n` +
        `- CONFIG_USER_COOKIE = \"<cookie tu trinh duyet da dang nhap>\"\n` +
        `- CONFIG_USER_AUTHORIZATION = \"Bearer <token>\" (neu co)\n` +
        `- CONFIG_USER_HEADERS = \"Header-A: value\\nHeader-B: value\" (neu can)`;
}

function errorFromApiResult(action, result) {
    if (result && result.response && (result.response.status === 401 || result.response.status === 403)) {
        return Response.error(buildAuthHelpMessage(action));
    }
    if (result && result.error && result.error.message) {
        return Response.error(`${action || "Request"} that bai: ${result.error.message}`);
    }
    return Response.error(`${action || "Request"} that bai`);
}

function normalizeStoryId(url) {
    const match = url.match(/([a-z0-9]{24})/);
    return match ? match[1] : "";
}
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}

try {
    if (CONFIG_API_BASE) {
        BASE_API_HOSTS = [String(CONFIG_API_BASE).replace(/\/api\/v\d+\/?$/, "")];
    }
} catch (error) {
}

try {
    if (CONFIG_API_BASES) {
        BASE_API_HOSTS = String(CONFIG_API_BASES)
            .split(",")
            .map(item => item.trim())
            .filter(item => item)
            .map(item => item.replace(/\/api\/v\d+\/?$/, ""));
    }
} catch (error) {
}

if (!BASE_API_HOSTS.length) {
    BASE_API_HOSTS = ["https://tata.noveltyt.app"];
}

try {
    if (CONFIG_CLIENT_ID) {
        BASE_CLIENT_ID = String(CONFIG_CLIENT_ID);
    }
} catch (error) {
}

try {
    if (CONFIG_CLIENT_TOKEN) {
        BASE_CLIENT_TOKEN = String(CONFIG_CLIENT_TOKEN);
    }
} catch (error) {
}

try {
    if (CONFIG_CLIENT_VERSION) {
        BASE_VERSION = String(CONFIG_CLIENT_VERSION);
    }
} catch (error) {
}

try {
    if (CONFIG_CLIENT_PLATFORM) {
        BASE_PLATFORM = String(CONFIG_CLIENT_PLATFORM);
    }
} catch (error) {
}

try {
    if (CONFIG_CLIENT_LANGUAGE) {
        BASE_LANGUAGE = String(CONFIG_CLIENT_LANGUAGE);
    }
} catch (error) {
}

try {
    if (CONFIG_AUTH_MODE) {
        AUTH_MODE = String(CONFIG_AUTH_MODE).toLowerCase() === "user" ? "user" : "app";
    }
} catch (error) {
}

try {
    if (CONFIG_USER_COOKIE) {
        USER_COOKIE = String(CONFIG_USER_COOKIE);
    }
} catch (error) {
}

try {
    if (CONFIG_USER_AUTHORIZATION) {
        USER_AUTHORIZATION = String(CONFIG_USER_AUTHORIZATION);
    }
} catch (error) {
}

try {
    if (CONFIG_USER_HEADERS) {
        USER_HEADERS = String(CONFIG_USER_HEADERS);
    }
} catch (error) {
}