const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');

/**
 * Get local IP address (IPv4)
 */
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const preferredInterfaces = ["Wi-Fi", "Ethernet", "en0", "wlan0"];
    
    for (const name of preferredInterfaces) {
        const ifaces = interfaces[name];
        if (ifaces) {
            for (const iface of ifaces) {
                if (iface.family === "IPv4" && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    
    for (const name of Object.keys(interfaces)) {
        const ifaces = interfaces[name];
        if (ifaces) {
            for (const iface of ifaces) {
                if (iface.family === "IPv4" && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    return "127.0.0.1";
}

/**
 * Send TCP request to the VBook app
 */
async function sendRequest(ip, port, headers, verbose = false) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let responseData = "";

        client.connect(port, ip, () => {
            if (verbose) console.log(`[TCP] Connected to ${ip}:${port}`);
            client.write(headers);
        });

        client.on("data", (data) => {
            responseData += data.toString();
        });

        client.on("end", () => {
            try {
                const bodyStartIndex = responseData.indexOf("{");
                if (bodyStartIndex < 0) {
                    return resolve(responseData); // Return raw if not JSON
                }
                const body = responseData.substring(bodyStartIndex);
                resolve(JSON.parse(body));
            } catch (error) {
                resolve(responseData);
            }
        });

        client.on("error", (error) => {
            reject(error);
        });

        client.setTimeout(15000, () => {
            client.destroy();
            reject(new Error("Connection timeout"));
        });
    });
}

module.exports = {
    getLocalIP,
    sendRequest
};
