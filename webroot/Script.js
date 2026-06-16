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
    setTimeout(() => {
        const btn = document.querySelector('.theme-toggle');
        if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
    }, 100);
})();

// 页面切换函数
function switchPage(pageName, element) {
    // 隐藏所有页面
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // 处理导航栏激活状态
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    let targetElement = element;
    if (!targetElement) {
        // 如果没有传入 element（例如初始化时），根据 pageName 寻找
        const links = {
            'config': 0,
            'bootconfig': 1,
            'changebox': 2,
            'about': 3
        };
        targetElement = navItems[links[pageName] || 0];
    }
    
    if (targetElement) {
        targetElement.classList.add('active');
        updateNavIndicator(targetElement);
    }
    
    // 显示指定页面
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // 特殊页面处理
        if (pageName === 'changebox') {
            window.loadModuleList?.();
        } else if (pageName === 'bootconfig') {
            window.loadBootConfig?.();
        }
    }
}
window.switchPage = switchPage;

// 更新导航栏指示器位置
function updateNavIndicator(element) {
    const indicator = document.querySelector('.nav-indicator');
    if (indicator && element) {
        indicator.style.width = `${element.offsetWidth}px`;
        indicator.style.left = `${element.offsetLeft}px`;
    }
}
window.updateNavIndicator = updateNavIndicator;

// 更新自启核心状态显示
async function updateCoreUI() {
    const coreCard = document.getElementById('core-card');
    if (!coreCard) return;

    const isRunning = await window.getCoreStatus?.();
    const isBootStart = await window.getBootStartStatus?.();
    
    coreCard.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; gap: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; flex-direction: column;">
                    <div style="font-size: 12px; opacity: 0.7;">自启核心 (keep_run.sh)</div>
                    <div style="font-size: 15px; font-weight: bold; color: ${isRunning ? '#81C784' : '#ff6b6b'};">
                        ${isRunning ? '● 正在运行' : '○ 已停止'}
                    </div>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button class="plugin-buttons" style="width: 60px; height: 30px; margin: 0; font-size: 12px; background: ${isRunning ? '#5c6bc0' : 'var(--vp-c-button)'};" onclick="handleCoreToggle('${isRunning ? 'restart' : 'start'}')">
                        ${isRunning ? '重启' : '启动'}
                    </button>
                    <button class="plugin-buttons" style="width: 60px; height: 30px; margin: 0; font-size: 12px; background: #ff6b6b;" onclick="handleCoreToggle('stop')">
                        关闭
                    </button>
                </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid rgba(128,197,131,0.1);">
                <div style="font-size: 13px;">开机自动启动核心</div>
                <label class="switch">
                    <input type="checkbox" ${isBootStart ? 'checked' : ''} onchange="handleBootToggle(this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        </div>
    `;
}
window.updateCoreUI = updateCoreUI;

async function handleCoreToggle(action) {
    const success = await window.toggleCore?.(action);
    if (success) {
        setTimeout(updateCoreUI, 500);
    }
}
window.handleCoreToggle = handleCoreToggle;

async function handleBootToggle(enable) {
    const success = await window.toggleBootStart?.(enable);
    if (success) {
        setTimeout(updateCoreUI, 300);
    }
}
window.handleBootToggle = handleBootToggle;

// 页面加载时导入模块并加载配置和设备信息
window.addEventListener('DOMContentLoaded', async () => {
    // 初始化导航栏位置
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) {
        setTimeout(() => updateNavIndicator(activeNav), 200);
    }
    
    // 监听窗口大小变化以重置指示器位置
    window.addEventListener('resize', () => {
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) updateNavIndicator(activeNav);
    });

    const module = await import('./Module.js');
    const { loadConfig, saveConfig, loadBootConfig, saveBootConfig, getBatteryInfo, getPhoneBrand, getFingerprint, getSerialNumber, loadModuleList, applyModule, getCurrentModuleName, getOriginalModel, updateDeviceInfo, restoreDevice, getCoreStatus, toggleCore, getBootStartStatus, toggleBootStart } = module;
    
    // 挂载到全局
    window.loadConfig = loadConfig;
    window.saveConfig = saveConfig;
    window.loadBootConfig = loadBootConfig;
    window.saveBootConfig = saveBootConfig;
    window.loadModuleList = loadModuleList;
    window.applyModule = applyModule;
    window.getCurrentModuleName = getCurrentModuleName;
    window.getOriginalModel = getOriginalModel;
    window.restoreDevice = restoreDevice;
    window.getCoreStatus = getCoreStatus;
    window.toggleCore = toggleCore;
    window.getBootStartStatus = getBootStartStatus;
    window.toggleBootStart = toggleBootStart;
    
    // 加载内容
    loadConfig();
    updateDeviceInfo();
    updateCoreUI();
    
    // 为自启配置页的按钮绑定事件
    const configButtons = document.querySelectorAll('#config-page .plugin-buttons');
    if (configButtons.length >= 2) {
        configButtons[0].onclick = () => window.loadConfig();
        configButtons[1].onclick = () => window.saveConfig();
    }

    // 为开机配置页的按钮绑定事件
    const bootConfigButtons = document.querySelectorAll('#bootconfig-page .plugin-buttons');
    if (bootConfigButtons.length >= 2) {
        bootConfigButtons[0].onclick = () => window.loadBootConfig();
        bootConfigButtons[1].onclick = () => window.saveBootConfig();
    }
    
    // 加载并显示设备信息
    try {
        const battery = await getBatteryInfo();
        const brand = await getPhoneBrand();
        const fingerprint = await getFingerprint();
        const sn = await getSerialNumber();
        
        document.getElementById('battery-card').innerHTML = `
            <div style="padding: 8px; text-align: center;">
                <div style="font-size: 12px; margin-bottom: 4px;">电量</div>
                <div style="width: 60px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${battery}%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.3s ease;"></div>
                </div>
                <div style="font-size: 12px; margin-top: 4px;">${battery}%</div>
            </div>
        `;
        
        document.getElementById('brand-card').innerHTML = `
            <div style="padding: 8px; text-align: center; overflow: hidden;">
                <div style="font-size: 12px; margin-bottom: 4px;">品牌</div>
                <div style="font-size: 14px; word-break: break-all;">${brand}</div>
            </div>
        `;
        
        document.getElementById('fingerprint-card').innerHTML = `
            <div style="padding: 8px; text-align: center; overflow: hidden;">
                <div style="font-size: 12px; margin-bottom: 4px;">设备指纹</div>
                <div style="font-size: 10px; word-break: break-all; max-height: 40px; overflow-y: auto;">${fingerprint}</div>
            </div>
        `;
        
        document.getElementById('sn-card').innerHTML = `
            <div style="padding: 8px; text-align: center; overflow: hidden;">
                <div style="font-size: 12px; margin-bottom: 4px;">序列号</div>
                <div style="font-size: 10px; word-break: break-all; max-height: 40px; overflow-y: auto;">${sn}</div>
            </div>
        `;
    } catch (error) {
        console.error('设备信息读取失败:', error);
    }
});