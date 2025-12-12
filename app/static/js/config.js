// app/static/js/config.js
// Конфигурация приложения SysDM
(function() {
    console.log('⚙️ Loading SysDM configuration...');
    
    // Базовые настройки по умолчанию
    const DEFAULT_CONFIG = {
        app_title: "SysDM",
        app_version: "1.0.0",
        debug: false,
        api_base: "/api/v1",
        user: null,
        timestamp: new Date().toISOString()
    };
    
    // Получаем конфигурацию из data-атрибутов
    const configScript = document.querySelector('script[data-sysdm-config]');
    
    if (configScript) {
        try {
            // Парсим JSON из data-атрибута
            const configData = JSON.parse(configScript.dataset.sysdmConfig);
            window.SYSDM_CONFIG = { ...DEFAULT_CONFIG, ...configData };
            console.log('✅ Configuration loaded:', window.SYSDM_CONFIG);
        } catch (error) {
            console.error('❌ Error parsing config:', error);
            window.SYSDM_CONFIG = DEFAULT_CONFIG;
        }
    } else {
        console.warn('⚠️ No configuration found, using defaults');
        window.SYSDM_CONFIG = DEFAULT_CONFIG;
    }
    
    // Экспортируем для использования в других модулях
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.SYSDM_CONFIG;
    }
})();
