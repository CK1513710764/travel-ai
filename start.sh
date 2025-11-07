#!/bin/bash

# Travel AI - Docker 一键启动脚本

echo "====================================="
echo "  Travel AI - Docker 部署脚本"
echo "====================================="
echo ""

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ 错误：未找到 .env 文件"
    echo ""
    echo "请按以下步骤操作："
    echo "1. 复制 .env.example 为 .env"
    echo "   cp .env.example .env"
    echo "2. 编辑 .env 文件，填入您的 API Keys"
    echo "3. 重新运行此脚本"
    echo ""
    exit 1
fi

echo "✓ 检测到 .env 文件"
echo ""
echo "正在构建并启动 Docker 容器..."
echo ""

# 构建并启动
docker-compose up --build -d

echo ""
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
echo "🎉 应用已成功启动！"
echo ""
echo "访问地址："
echo "  前端: http://localhost:8080"
echo "  后端: http://localhost:5000"
echo ""
echo "查看日志："
echo "  docker-compose logs -f"
echo ""
echo "停止应用："
echo "  docker-compose down"
echo ""

