#!/system/bin/sh
MODDIR=${0%/*}

Volume() {
  local key_click=""
  while [ "$key_click" = "" ]; do
    key_event=$(getevent -lqc 1 2>/dev/null | grep -E "KEY_VOLUMEUP|KEY_VOLUMEDOWN")
    
    if echo "$key_event" | grep -q "KEY_VOLUMEUP"; then
        key_click="UP"
    elif echo "$key_event" | grep -q "KEY_VOLUMEDOWN"; then
        key_click="DOWN"
    fi
    
    if [ -n "$key_click" ]; then
        sleep 0.2
    fi
  done
  echo "$key_click"
}

Cleaner() {
  (
  #三角洲行动
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.dfm/files
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.dfm/cache
  rm -rf /data/user/*/com.tencent.tmgp.dfm/app_*
  rm -rf /data/user/*/com.tencent.tmgp.dfm/cache
  rm -rf /data/user/*/com.tencent.tmgp.dfm/code_cache
  rm -rf /data/user/*/com.tencent.tmgp.dfm/databases
  rm -rf /data/user/*/com.tencent.tmgp.dfm/filescommonCache
  rm -rf /data/user/*/com.tencent.tmgp.dfm/shared_prefs
  rm -f /data/user/*/com.tencent.tmgp.dfm/files/*
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/.*
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/ano_tmp
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/app
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/beacon
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/com.gcloudsdk.gcloud.gvoice
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/data
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/perfsight
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/live_log
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/popup
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/tbs
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/qm
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/shell_cache
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/tdm_tmp
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/wupSCache
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/UE4Game/DeltaForce/DeltaForce/Saved/LoadTrack
  rm -f /data/user/*/com.tencent.tmgp.dfm/files/UE4Game/DeltaForce/*
  rm -rf /data/user/*/com.tencent.tmgp.dfm/files/UE4Game/DeltaForce/DeltaForce/Intermediate
  
  #三角洲残留
  rm -rf /storage/emulated/*/Documents
  rm -f /storage/emulated/*/Download/*
  
  #瓦罗兰特
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/cache
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/env
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/EstvShadowPlugin
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/file_cnf
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/itop
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/log
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/midas
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/tbslog
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/tencent
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/TGPA
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/VulkanProgramBinaryCache
  rm -f /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/UE4Game/CodeV/*
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/UE4Game/CodeV/CodeV/Saved/Gamelet/logs
  rm -rf /storage/emulated/*/Android/data/com.tencent.tmgp.codev/files/UE4Game/CodeV/CodeV/Saved/Logs
  rm -rf /data/user/*/com.tencent.tmgp.codev/app_*
  rm -rf /data/user/*/com.tencent.tmgp.codev/cache
  rm -rf /data/user/*/com.tencent.tmgp.codev/code_cache
  rm -rf /data/user/*/com.tencent.tmgp.codev/databases
  rm -rf /data/user/*/com.tencent.tmgp.codev/EstvShadowPlugin_shadow-app
  rm -rf /data/user/*/com.tencent.tmgp.codev/files
  rm -rf /data/user/*/com.tencent.tmgp.codev/no_backup
  rm -rf /data/user/*/com.tencent.tmgp.codev/shared_prefs
  
  ) 2>/dev/null
  
  #输出
  echo "✅强标清理成功"
}

Toggle_USB() {
  local ADB=$(settings get global adb_enabled)
  if [ "$ADB" = "1" ]; then
    settings put global adb_enabled 0
    sed -i "s/❌关闭USB调试/✅关闭USB调试/" "$MODDIR/module.prop"
  else
    settings put global adb_enabled 1
    sed -i "s/✅关闭USB调试/❌关闭USB调试/" "$MODDIR/module.prop"
  fi
  
  #输出
  echo "✅ADB状态切换成功"
}

echo "==============================="
echo "➕ Cleaner"
echo "➖ Toggle_USB"
echo "==============================="

key=$(Volume)
case "$key" in
  UP)
  Cleaner
  exit 0
  ;;
  DOWN)
  Toggle_USB
  exit 0
  ;;
esac