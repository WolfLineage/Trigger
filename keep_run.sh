#!/system/bin/sh

MODDIR=${0%/*}

# 配置文件
CONFIGS_FILE="/data/adb/.Magic/Trigger/kernel_config.txt"
COUNTER_FILE="/data/adb/.Magic/Trigger/launch_counter.txt"

# 处理计数文件
update_counter() {
    local COUNT=0
    [ -f "$COUNTER_FILE" ] && COUNT=$(cat "$COUNTER_FILE" 2>/dev/null)
    [ -z "$COUNT" ] && COUNT=0
    COUNT=$((COUNT + 1))
    echo "$COUNT" > "$COUNTER_FILE"

    local PROP="$MODDIR/module.prop"
    local PROP_TMP="$MODDIR/module.prop.tmp"

    local OLD_DESC=$(grep "^description=" "$PROP" | cut -d'=' -f2-)
    local NEW_DESC=$(echo "$OLD_DESC" | sed "s/累计[0-9]*次/累计${COUNT}次/")
    
    grep -v "^description=" "$PROP" > "$PROP_TMP"
    echo "description=$NEW_DESC" >> "$PROP_TMP"
    cp -f "$PROP_TMP" "$PROP"
    rm -f "$PROP_TMP"
}

# 处理单个应用
handle_app() {
    local APP_PKG="$1"
    local SCRIPT="$2"
    local INPUT="$3"

    local PROC=$(basename "$SCRIPT")
    local PROC_PATH=$(dirname "$SCRIPT")
    # 包名替换点为下划线，生成独立PID文件
    local PID_FILE="/data/adb/.Magic/Trigger/kernel_${APP_PKG//./_}.pid"
    # 单独读取PID，屏蔽错误
    local RUN_PID=$(cat "$PID_FILE" 2>/dev/null)

    if pgrep -f "$APP_PKG" > /dev/null; then
        local NOW_PID=$(cat "$PID_FILE" 2>/dev/null)
        # 判断：无文件 或 PID为空 或 进程已关闭
        if [ ! -f "$PID_FILE" ] || [ -z "$NOW_PID" ] || ! kill -0 "$NOW_PID" 2>/dev/null; then
            (
                cd "$PROC_PATH"
                eval "IN_CONTENT=\$'$INPUT'"
                "$SCRIPT" <<< "$IN_CONTENT"
                update_counter
            )
            sleep 1
            pgrep -f "$PROC" | tail -n1 > "$PID_FILE"
        fi
    else
        pkill -f "$PROC" 2>/dev/null
        kill -9 "$RUN_PID" 2>/dev/null
        rm -f "$PID_FILE"
    fi
}

# 主循环
while true; do
    # 检测配置文件是否存在
    if [ ! -f "$CONFIGS_FILE" ]; then
        sleep 1
        continue
    fi
    # 逐行读取外部配置
    while IFS='=' read -r APP_PKG SCRIPT INPUT
    do
        # 跳过空行和注释行（#开头）
        [ -z "$APP_PKG" ] && continue
        echo "$APP_PKG" | grep -q "^#" && continue
        handle_app "$APP_PKG" "$SCRIPT" "$INPUT"
    done < "$CONFIGS_FILE"
    sleep 3
done
