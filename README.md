# 🥑 Trigger

一个专为 Magisk / KernelSU / APatch 打造的自动化触发与环境优化模块。

---

## 🌈 功能特性 (Features)

* **自动化脚本触发**：支持基于应用启动的 Shell 监听与自动执行。
* **一键切换全局改机型**：非同COPG这样基于zygisk的模块，实现批量管理全局改机型。
* **ColorOS 专属优化**：
  * 彻底移除 **ColorOS 温度墙**，释放极致性能。
  * 一键切换 **ColorOS ADB 状态**。
* **安全防护**：开机时自动禁用 ADB，保护设备隐私。

---

## ⚡ 配置文件说明 (Configuration)
* **一键改机型**：只需将改机型模块放置在`/data/adb/.Magic/Trigger/custom_modules`中即可自动获取机型信息
* **配置文件路径**：`/data/adb/.Magic/Trigger/kernel_config.txt`

> ⚠️ **重要提示 (TIPS):** 
> 编写配置时，**请在末尾留空行或注释行**，否则可能导致模块解析失败，配置无法生效！

### 📝 配置格式
配置采用极简的赋值规则，格式如下：
```text
$APP_PKG=$PATH=$INPUT

示例
#################################################
com.tencent.tmgp.dfm=/data/adb/kernel.sh=1\n2\n
#################################################
