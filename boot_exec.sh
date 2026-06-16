#!/system/bin/sh
exec </dev/null >/dev/null 2>&1

MODDIR=${0%/*}
BOOT_CONF="/data/adb/.Magic/Trigger/boot_config.txt"

until [ "$(getprop sys.boot_completed)" = "1" ]; do
    sleep 2
done

[ -f "$BOOT_CONF" ] || exit 0

elapsed=0
until curl -s --connect-timeout 3 http://www.baidu.com >/dev/null 2>&1 || ping -c 1 www.baidu.com >/dev/null 2>&1; do
    sleep 2
    elapsed=$((elapsed + 2))
    [ $elapsed -ge 60 ] && exit 0
done

# 使用 tr 删除回车符，使用 while read 精准处理带空格的路径
grep -vE '^#|^$' "$BOOT_CONF" | tr -d '\r' | while IFS='=' read -r path params; do
    [ -z "$path" ] && continue
    
    if [ -f "$path" ]; then
        chmod 0777 "$path"
        (
            cd "$(dirname "$path")"
            eval "IN_CONTENT=\$'$params'"
            "$path" <<< "$IN_CONTENT"
        ) &
    fi
done
