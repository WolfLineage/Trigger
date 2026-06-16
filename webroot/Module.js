import { exec } from 'https://esm.sh/kernelsu';

const CONGFIG_PATH = "/data/adb/.Magic/Trigger/kernel_config.txt";
const CUSTOM_MODULE_DIR = "/data/adb/.Magic/Trigger/custom_modules";
const ORIGINAL_MODEL_FILE = "/data/adb/.Magic/Trigger/original_model.txt";

// Base64 编解码
const encode = str => btoa(String.fromCharCode(...new TextEncoder().encode(str)));
const decode = base64 => {
    try {
        const binary = atob(base64.trim());
        return new TextDecoder().decode(new Uint8Array([...binary].map(c => c.charCodeAt(0))));
    } catch { return null; }
};

// 自定义toast通知
function showToast(message, isError = false) {
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 1300);
}

export async function loadConfig() {
    const textarea = document.querySelector('textarea');
    const { stdout } = await exec(`cat "${CONGFIG_PATH}" 2>/dev/null | base64 -w 0`);
    if (stdout?.trim()) {
        const decoded = decode(stdout.trim());
        if (decoded !== null) {
            textarea.value = decoded;
            showToast('加载成功');
            return;
        }
    }
    textarea.value = '';
    showToast('文件为空或不存在', true);
}

export async function saveConfig() {
    const textarea = document.querySelector('textarea');
    const content = textarea.value;
    if (!content.trim()) { showToast('内容不能为空', true); return; }

    const { stdout } = await exec(`mkdir -p "$(dirname ${CONGFIG_PATH})" && echo -n "${encode(content)}" | base64 -d > "${CONGFIG_PATH}" && echo OK`);

    if (stdout?.includes('OK')) {
        showToast('保存成功');
    } else {
        showToast('保存失败', true);
    }
}

// 设备信息读取函数
export async function getBatteryInfo() {
    try {
        const { stdout } = await exec(`dumpsys battery 2>/dev/null | grep "level:" | awk '{print $2}'`);
        return parseInt(stdout?.trim()) || 0;
    } catch {
        return 0;
    }
}

export async function getPhoneBrand() {
    try {
        const { stdout } = await exec(`getprop ro.product.brand 2>/dev/null || getprop ro.product.manufacturer`);
        return stdout?.trim() || '未知';
    } catch {
        return '未知';
    }
}

export async function getFingerprint() {
    try {
        const { stdout } = await exec(`getprop ro.build.fingerprint`);
        return stdout?.trim() || '未知';
    } catch {
        return '未知';
    }
}

export async function getSerialNumber() {
    try {
        const { stdout } = await exec(`getprop ro.serialno`);
        return stdout?.trim() || '未获取';
    } catch {
        return '未获取';
    }
}

// 获取当前应用的机型模块名称
export async function getCurrentModuleName() {
    try {
        const { stdout } = await exec(`grep "^# 自定义机型模块：" /data/adb/modules/Trigger/system.prop | tail -1 | sed 's/^# 自定义机型模块：//'`);
        const moduleName = stdout?.trim();
        return moduleName || "未修改";
    } catch {
        return "未修改";
    }
}

// 获取原始机型（修复：优先从持久化文件读取）
export async function getOriginalModel() {
    try {
        const { stdout } = await exec(`cat "${ORIGINAL_MODEL_FILE}" 2>/dev/null`);
        if (stdout?.trim()) return stdout.trim();
        
        const { stdout: currentModel } = await exec(`getprop ro.product.model`);
        const model = currentModel?.trim() || '未知';
        if (model !== '未知') {
            await exec(`echo "${model}" > "${ORIGINAL_MODEL_FILE}"`);
        }
        return model;
    } catch {
        return '未知';
    }
}

// 扫描并加载自定义模块列表
export async function loadModuleList() {
    try {
        const moduleList = document.getElementById('module-list');
        if (!moduleList) return;
        
        moduleList.innerHTML = '<div class="loading-tip">扫描中...</div>';
        await exec(`mkdir -p "${CUSTOM_MODULE_DIR}"`);
        
        const { stdout } = await exec(`ls -1 "${CUSTOM_MODULE_DIR}"/*.zip 2>/dev/null || echo ""`);
        const files = stdout?.trim().split('\n').filter(f => f.trim()) || [];
        
        if (files.length === 0) {
            moduleList.innerHTML = `<div class="empty-tip">暂无可用的机型模块<br/>请放置 zip 文件至：<br/><small>${CUSTOM_MODULE_DIR}</small></div>`;
            return;
        }
        
        moduleList.innerHTML = '';
        files.forEach(filepath => {
            const filename = filepath.split('/').pop();
            const item = document.createElement('div');
            item.className = 'module-item';
            item.innerHTML = `
                <div class="module-item-name">📦 ${filename}</div>
                <div class="module-item-status">点击切换</div>
            `;
            item.onclick = () => applyModule(filepath, filename);
            moduleList.appendChild(item);
        });
        
    } catch (error) {
        console.error(error);
    }
}

// 应用机型模块
export async function applyModule(zipPath, moduleName) {
    try {
        if (!confirm(`确定要切换到 [${moduleName}] 吗？`)) return;
        
        showToast('正在应用机型模块...');
        const scriptPath = "/data/adb/modules/Trigger/load_custom_modules.sh";
        const cmd = `chmod 755 ${scriptPath} && ${scriptPath} load "${zipPath}"`;
        const { stdout } = await exec(cmd);
        
        if (stdout?.includes('成功')) {
            showToast('机型模块已应用！请重启生效');
            await updateDeviceInfo();
        } else {
            showToast('应用失败', true);
        }
    } catch (error) {
        showToast('执行失败', true);
    }
}

// 还原机型
export async function restoreDevice() {
    try {
        if (!confirm('确定要还原到原始机型吗？')) return;
        
        showToast('正在还原机型...');
        const scriptPath = "/data/adb/modules/Trigger/load_custom_modules.sh";
        const { stdout } = await exec(`chmod 755 ${scriptPath} && ${scriptPath} restore`);
        
        if (stdout?.includes('成功')) {
            showToast('机型已还原！请重启生效');
            await updateDeviceInfo();
        } else {
            showToast('还原失败', true);
        }
    } catch (error) {
        showToast('执行失败', true);
    }
}

// 更新设备信息显示
export async function updateDeviceInfo() {
    try {
        const currentModuleName = await getCurrentModuleName();
        const originalModel = await getOriginalModel();
        
        const currentModelEl = document.getElementById('current-model');
        const originalModelEl = document.getElementById('original-model');
        
        if (currentModelEl) currentModelEl.textContent = currentModuleName;
        if (originalModelEl) originalModelEl.textContent = originalModel;
    } catch (error) {
        console.error(error);
    }
}

// 页面加载
window.addEventListener('DOMContentLoaded', async () => {
    const { loadConfig, updateDeviceInfo, loadModuleList } = await import('./Module.js');
    window.loadConfig = loadConfig;
    window.saveConfig = (await import('./Module.js')).saveConfig;
    window.restoreDevice = (await import('./Module.js')).restoreDevice;
    
    loadConfig();
    updateDeviceInfo();
    loadModuleList();
});