// Load extensions data
// Format: {novel: [...], comic: [...], ...}
const extensionCatalog = {
    novel: [],
    comic: [],
    chinese_novel: [],
    translate: [],
    tts: [],
    _unknown: []
};

// Load from ./catalog.json (local copy of extensions/plugin.json)
async function loadExtensions() {
    try {
        const response = await fetch('./catalog.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        
        // Populate catalog from loaded data
        Object.keys(data).forEach(type => {
            if (extensionCatalog.hasOwnProperty(type) && Array.isArray(data[type])) {
                extensionCatalog[type] = data[type];
            }
        });
        
        // Trigger render
        renderDashboard();
    } catch (error) {
        console.error('Error loading extensions:', error);
        // Show error message
        document.getElementById('extensions-grid').innerHTML = 
            `<div style="grid-column: 1/-1; padding: 20px; color: red;">
                Lỗi: Không thể tải catalog.json. Hãy chạy build-catalog rồi đồng bộ lại web/catalog.json
            </div>`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadExtensions);
