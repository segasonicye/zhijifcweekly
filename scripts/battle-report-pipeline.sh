#!/bin/bash
#
# 战报自动化流程编排脚本
# 用途：从数据采集到发布的完整流程
#

set -e  # 遇到错误立即退出

# 配置
PROJECT_DIR="/Users/yesu/zhijifcweekly"
LOG_DIR="$PROJECT_DIR/logs/battle-report"
DATE=$(date +%Y-%m-%d)

# 创建日志目录
mkdir -p "$LOG_DIR"

# 日志文件
LOG_FILE="$LOG_DIR/pipeline-$DATE.log"

echo "[$(date)] 🚀 战报自动化流程开始" | tee -a "$LOG_FILE"

# 检查参数
if [ -z "$1" ]; then
    echo "❌ 用法: $0 <markdown-file>"
    echo "   示例: $0 matches/2026-01-09-内战.md"
    echo "   或使用交互式: $0 interactive"
    exit 1
fi

MARKDOWN_FILE="$1"

# 如果是交互式模式，先创建数据文件
if [ "$MARKDOWN_FILE" = "interactive" ]; then
    echo "[$(date)] 📝 步骤1/4: 交互式创建战报数据..." | tee -a "$LOG_FILE"
    cd "$PROJECT_DIR"
    node scripts/parse-report.js
    
    # 查找最新创建的文件
    LATEST_FILE=$(ls -t matches/*.md | head -1)
    if [ -z "$LATEST_FILE" ]; then
        echo "❌ 未找到最新创建的战报文件"
        exit 1
    fi
    MARKDOWN_FILE="$LATEST_FILE"
    echo "[$(date)] ✅ 战报文件已创建: $MARKDOWN_FILE" | tee -a "$LOG_FILE"
fi

# 验证文件存在
if [ ! -f "$MARKDOWN_FILE" ]; then
    echo "❌ 文件不存在: $MARKDOWN_FILE"
    exit 1
fi

# 步骤2: 生成多种风格的预览
echo "[$(date)] 🎨 步骤2/4: 生成战报预览..." | tee -a "$LOG_FILE"

# 检查是否存在对应的发布脚本
STYLE_SCRIPTS=(
    "publish-battle.js"
    "publish-cyber.js"
    "publish-field.js"
    "publish-fresh.js"
    "publish-ins.js"
)

for script in "${STYLE_SCRIPTS[@]}"; do
    if [ -f "$PROJECT_DIR/scripts/$script" ]; then
        echo "[$(date)]   - 生成预览: $script" | tee -a "$LOG_FILE"
        # 这里只是预览，不实际发布
        # 实际发布需要手动运行相应的脚本
    fi
done

# 步骤3: 推送到公众号（默认风格）
echo "[$(date)] 📤 步骤3/4: 推送到公众号草稿箱..." | tee -a "$LOG_FILE"
cd "$PROJECT_DIR"
node scripts/publish-optimized.js "$MARKDOWN_FILE" 2>&1 | tee -a "$LOG_FILE"

# 步骤4: 更新回看页面
echo "[$(date)] 📊 步骤4/4: 更新战报回看页面..." | tee -a "$LOG_FILE"
node scripts/modern-matches.js 2>&1 | tee -a "$LOG_FILE"

echo "[$(date)] ✅ 战报自动化流程完成" | tee -a "$LOG_FILE"

# 发送通知（可选，可配置 webhook）
# if [ -n "$WEBHOOK_URL" ]; then
#     curl -X POST "$WEBHOOK_URL" -d "战报发布完成: $MARKDOWN_FILE"
# fi
