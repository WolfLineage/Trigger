import { exec } from 'https://esm.sh/kernelsu';

const CONGFIG_PATH = "/data/adb/.Magic/Trigger/kernel_config.txt";
const BOOT_CONFIG_PATH = "/data/adb/.Magic/Trigger/boot_config.txt";
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
    const textarea = document.querySelector('#config-page textarea');
    if (!textarea) return;
    const { stdout } = await exec(`cat "${CONGFIG_PATH}" 2>/dev/null | base64 -w 0`);
    if (stdout?.trim()) {
        const decoded = decode(stdout.trim());
        if (decoded !== null) {
            textarea.value = decoded;
            showToast('自启配置加载成功');
            return;
        }
    }
    textarea.value = '';
    showToast('自启配置为空或不存在', true);
}

export async function saveConfig() {
    const textarea = document.querySelector('#config-page textarea');
    if (!textarea) return;
    const content = textarea.value;
    if (!content.trim()) { showToast('内容不能为空', true); return; }

    const { stdout } = await exec(`mkdir -p "$(dirname ${CONGFIG_PATH})" && echo -n "${encode(content)}" | base64 -d > "${CONGFIG_PATH}" && echo OK`);

    if (stdout?.includes('OK')) {
        showToast('自启配置保存成功');
    } else {
        showToast('自启配置保存失败', true);
    }
}

export async function loadBootConfig() {
    const textarea = document.querySelector('#bootconfig-page textarea');
    if (!textarea) return;
    const { stdout } = await exec(`cat "${BOOT_CONFIG_PATH}" 2>/dev/null | base64 -w 0`);
    if (stdout?.trim()) {
        const decoded = decode(stdout.trim());
        if (decoded !== null) {
            textarea.value = decoded;
            showToast('开机配置加载成功');
            return;
        }
    }
    textarea.value = '';
    showToast('开机配置为空或不存在', true);
}

export async function saveBootConfig() {
    const textarea = document.querySelector('#bootconfig-page textarea');
    if (!textarea) return;
    const content = textarea.value;
    if (!content.trim()) { showToast('内容不能为空', true); return; }

    const { stdout } = await exec(`mkdir -p "$(dirname ${BOOT_CONFIG_PATH})" && echo -n "${encode(content)}" | base64 -d > "${BOOT_CONFIG_PATH}" && echo OK`);

    if (stdout?.includes('OK')) {
        showToast('开机配置保存成功');
    } else {
        showToast('开机配置保存失败', true);
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

// 自启核心（keep_run.sh）状态管理
export async function getCoreStatus() {
    try {
        const { stdout } = await exec(`pgrep -f keep_run.sh`);
        return !!stdout?.trim();
    } catch {
        return false;
    }
}

export async function toggleCore(action) {
    try {
        const scriptPath = "/data/adb/modules/Trigger/keep_run.sh";
        if (action === 'stop' || action === 'restart') {
            await exec(`pkill -f keep_run.sh`);
            if (action === 'stop') return true;
            await new Promise(r => setTimeout(r, 500));
        }
        await exec(`chmod 755 ${scriptPath} && nohup sh ${scriptPath} >/dev/null 2>&1 &`);
        return true;
    } catch {
        return false;
    }
}

// 开机自启管理（操作 post-fs-data.sh）
const POST_FS_DATA = "/data/adb/modules/Trigger/post-fs-data.sh";

export async function getBootStartStatus() {
    try {
        // 查找 [BOOT_CONTROL] 标记下的那行 exit 0
        const { stdout } = await exec(`grep -A 1 "\\[BOOT_CONTROL\\]" "${POST_FS_DATA}" | tail -n 1`);
        // 如果该行以 # 开头，说明 exit 0 被注释了，即：已启用自启
        return stdout?.trim().startsWith('#');
    } catch {
        return false;
    }
}

export async function toggleBootStart(enable) {
    try {
        if (enable) {
            // 开启自启：注释掉 exit 0
            await exec(`sed -i '/\\[BOOT_CONTROL\\]/{n;s/^exit 0/# exit 0/}' "${POST_FS_DATA}"`);
        } else {
            // 关闭自启：取消 exit 0 的注释
            await exec(`sed -i '/\\[BOOT_CONTROL\\]/{n;s/^# exit 0/exit 0/}' "${POST_FS_DATA}"`);
        }
        return true;
    } catch {
        return false;
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

// 获取原始机型（优先从持久化文件读取）
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