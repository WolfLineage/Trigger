MODDIR=${0%/*}

#关闭adb
sleep 15
settings put global adb_enabled 0
sed -i "s/❌关闭USB调试/✅关闭USB调试/" "$MODDIR/module.prop"

# 关闭温控解除限制
while :
do
    setprop init.svc.thermal-engine stopped
    setprop init.svc.android.thermal-hal stopped
    echo "0 37000" > /proc/shell-temp
    echo "1 37000" > /proc/shell-temp
    echo "2 37000" > /proc/shell-temp
    sleep 60
done