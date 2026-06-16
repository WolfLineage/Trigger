#!/system/bin/sh
# 机型模块管理脚本
# 直接修改Trigger/system.prop，重启后自动生效

MODULE_DIR="/data/adb/modules/Trigger"
MODULE_PROP="$MODULE_DIR/module.prop"
MODULE_SYSTEM_PROP="$MODULE_DIR/system.prop"
DATA_DIR="/data/adb/.Magic/Trigger"
BACKUP_DIR="$DATA_DIR/prop_backups"
TEMP_DIR="$DATA_DIR/temp_extract"
ORIGINAL_BACKUP="$BACKUP_DIR/original.bak"
ORIGINAL_MODEL_FILE="$DATA_DIR/original_model.txt"

mkdir -p "$BACKUP_DIR" "$TEMP_DIR"

# 记录原始机型
record_original_model() {
    if [ ! -f "$ORIGINAL_MODEL_FILE" ]; then
        getprop ro.product.model > "$ORIGINAL_MODEL_FILE"
    fi
}

# 更新 module.prop 描述
update_description() {
    local name="$1"
    if [ -f "$MODULE_PROP" ]; then
        sed -i "s/📱机型:.*/📱机型:$name/" "$MODULE_PROP"
    fi
}

# 应用机型模块
apply_module() {
    local zip_file="$1"
    
    if [ ! -f "$zip_file" ]; then
        echo "错误：找不到zip文件" >&2
        return 1
    fi

    record_original_model

    # 首次应用时备份原始system.prop
    if [ ! -f "$ORIGINAL_BACKUP" ]; then
        if [ -f "$MODULE_SYSTEM_PROP" ]; then
            cp "$MODULE_SYSTEM_PROP" "$ORIGINAL_BACKUP"
        else
            touch "$ORIGINAL_BACKUP"
        fi
    fi
    
    # 恢复原始状态
    cp "$ORIGINAL_BACKUP" "$MODULE_SYSTEM_PROP" || return 1
    
    # 提取zip中的system.prop
    local module_name=$(basename "$zip_file" .zip)
    local temp_dir="$TEMP_DIR/$module_name"
    mkdir -p "$temp_dir" || return 1
    
    if ! unzip -o "$zip_file" -d "$temp_dir" >/dev/null 2>&1; then
        echo "错误：解压失败" >&2
        rm -rf "$temp_dir"
        return 1
    fi
    
    if [ ! -f "$temp_dir/system.prop" ]; then
        echo "错误：zip中无system.prop" >&2
        rm -rf "$temp_dir"
        return 1
    fi
    
    echo "" >> "$MODULE_SYSTEM_PROP"
    echo "# 自定义机型模块：$module_name" >> "$MODULE_SYSTEM_PROP"
    cat "$temp_dir/system.prop" >> "$MODULE_SYSTEM_PROP"

    # 更新模块描述
    update_description "$module_name"

    rm -rf "$temp_dir"
    echo "成功"
    return 0
}

# 还原原始
restore_module() {
    if [ -f "$ORIGINAL_BACKUP" ]; then
        cp "$ORIGINAL_BACKUP" "$MODULE_SYSTEM_PROP"
        update_description "未修改"
        echo "成功"
        return 0
    else
        echo "错误：找不到备份" >&2
        return 1
    fi
}

# 主逻辑
case "$1" in
    load)
        apply_module "$2"
        exit $?
        ;;
    restore)
        restore_module
        exit $?
        ;;
esac