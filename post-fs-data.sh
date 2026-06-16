#!/system/bin/sh
MODDIR=${0%/*}
mount --bind $MODDIR/odm/etc/temperature_profile/sys_high_temp_protect_OPPO_23821.xml /odm/etc/temperature_profile/sys_high_temp_protect_OPPO_23821.xml
mount --bind $MODDIR/odm/etc/temperature_profile/sys_thermal_control_config.xml /odm/etc/temperature_profile/sys_thermal_control_config.xml
mount --bind $MODDIR/odm/etc/ThermalServiceConfig /odm/etc/ThermalServiceConfig
mount --bind $MODDIR/odm/firmware/fastchg/bms_heating_config.txt /odm/firmware/fastchg/bms_heating_config.txt

# 启动开机一次性任务
BOOT_EXEC="${MODDIR}/boot_exec.sh"
if [ -f "${BOOT_EXEC}" ]; then
    chmod 755 "${BOOT_EXEC}"
    nohup sh "${BOOT_EXEC}" >/dev/null 2>&1 &
fi

# [BOOT_CONTROL] 下行 exit 则不启动核心
# exit 0

# 启动自启核心
SCRIPT_PATH="${MODDIR}/keep_run.sh"
if [ -f "${SCRIPT_PATH}" ]; then
    chmod 755 "${SCRIPT_PATH}"
    if ! pgrep -f "keep_run.sh" >/dev/null 2>&1; then
        nohup sh "${SCRIPT_PATH}" >/dev/null 2>&1 &
    fi
fi
