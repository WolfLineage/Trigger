#!/system/bin/sh
(
mkdir -p /data/adb/.Magic/Trigger
touch /data/adb/.Magic/Trigger/kernel_config.txt
touch /data/adb/.Magic/Trigger/custom_modules
am start -a android.intent.action.VIEW -d "mqqapi://card/show_pslcard?src_type=internal&version=1&uin=690837385&card_type=group"
) 2>/dev/null