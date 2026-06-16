function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.querySelector('.theme-toggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

(function() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.querySelector('.theme-toggle').textContent = saved === 'dark' ? '☀️' : '🌙';
})();

// 页面切换函数
function switchPage(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示指定页面
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // 如果切换到改机型页面，加载模块列表
        if (pageName === 'changebox') {
            window.loadModuleList?.();
        }
    }
}

// 页面加载时导入模块并加载配置和设备信息
window.addEventListener('DOMContentLoaded', async () => {
    const module = await import('./Module.js');
    const { loadConfig, getBatteryInfo, getPhoneBrand, getFingerprint, getSerialNumber, loadModuleList, applyModule, getCurrentModuleName, getOriginalModel, updateDeviceInfo, restoreDevice } = module;
    
    // 挂载到全局
    window.loadConfig = loadConfig;
    window.saveConfig = module.saveConfig;
    window.loadModuleList = loadModuleList;
    window.applyModule = applyModule;
    window.getCurrentModuleName = getCurrentModuleName;
    window.getOriginalModel = getOriginalModel;
    window.restoreDevice = restoreDevice;
    
    // 加载配置
    loadConfig();
    updateDeviceInfo();
    
    // 为配置页的按钮绑定事件
    const buttons = document.querySelectorAll('#config-page .plugin-buttons');
    if (buttons.length >= 2) {
        buttons[0].onclick = () => window.loadConfig();
        buttons[1].onclick = () => window.saveConfig();
    }
    
    // 加载并显示设备信息
    try {
        const battery = await getBatteryInfo();
        const brand = await getPhoneBrand();
        const fingerprint = await getFingerprint();
        const sn = await getSerialNumber();
        
        // 显示电量进度条
        const batteryCard = document.getElementById('battery-card');
        batteryCard.innerHTML = `
            <div style="padding: 8px; text-align: center;">
                <div style="font-size: 12px; margin-bottom: 4px;">电量</div>
                <div style="width: 60px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${battery}%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.3s ease;"></div>
                </div>
                <div style="font-size: 12px; margin-top: 4px;">${battery}%</div>
            </div>
        `;
        
        // 显示品牌
        const brandCard = document.getElementById('brand-card');
        brandCard.innerHTML = `
            <div style="padding: 8px; text-align: center; overflow: hidden; text-overflow: ellipsis;">
                <div style="font-size: 12px; margin-bottom: 4px;">品牌</div>
                <div style="font-size: 14px; word-break: break-all;">${brand}</div>
            </div>
        `;
        
        // 显示指纹
        const fingerprintCard = document.getElementById('fingerprint-card');
        fingerprintCard.innerHTML = `
            <div style="padding: 8px; text-align: center; overflow: hidden;">
                <div style="font-size: 12px; margin-bottom: 4px;">设备指纹</div>
                <div style="font-size: 10px; word-break: break-all; max-height: 40px; overflow-y: auto;">${fingerprint}</div>
            </div>
        `;
        
        // 显示序列号
        const snCard = document.getElementById('sn-card');
        snCard.innerHTML = `
            <div style="padding: 8px; text-align: center; overflow: hidden;">
                <div style="font-size: 12px; margin-bottom: 4px;">序列号</div>
                <div style="font-size: 10px; word-break: break-all; max-height: 40px; overflow-y: auto;">${sn}</div>
            </div>
        `;
    } catch (error) {
        console.error('设备信息读取失败:', error);
    }
});


