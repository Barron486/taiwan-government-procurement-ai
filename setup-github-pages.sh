#!/bin/bash

# GitHub Pages 部署設定腳本
# 此腳本會自動設定 GitHub Pages 部署

echo "🚀 開始設定 GitHub Pages 部署..."

# 檢查是否在 Git repository 中
if [ ! -d ".git" ]; then
    echo "❌ 錯誤：請在 Git repository 中執行此腳本"
    exit 1
fi

# 建立 GitHub Pages 分支
echo "📄 建立 GitHub Pages 分支..."
git checkout -b gh-pages 2>/dev/null || git checkout gh-pages

# 複製 GitHub Pages 版本檔案
echo "📋 準備 GitHub Pages 檔案..."
cp index-github.html index.html

# 建立 GitHub Pages 專用的公司分析頁面
echo "🏢 準備公司分析頁面..."
cp company_analysis.html company_analysis-github.html

# 修改公司分析頁面以支援 GitHub Pages
echo "🔧 修改公司分析頁面以支援 GitHub Pages..."
sed -i.bak 's/config\.js/\/\/ config.js (GitHub Pages 模式)/g' company_analysis-github.html
sed -i.bak 's/window\.API_CONFIG/\/\/ window.API_CONFIG (GitHub Pages 模式)/g' company_analysis-github.html

# 建立 GitHub Pages 專用的 README
echo "📝 建立 GitHub Pages README..."
cat > README-github.md << 'EOF'
# 台灣政府採購公告查詢系統 - GitHub Pages 版本

## ⚠️ 重要提醒

這是 GitHub Pages 版本，可能受到 CORS 限制影響。

**建議使用 Vercel 版本以獲得最佳體驗：**
- 完整功能支援
- API 代理解決 CORS 問題
- 更好的效能和穩定性

## 功能限制

- ✅ 基本搜尋功能
- ✅ AI 分析（需要 API Key）
- ⚠️ 標案詳情可能無法載入（CORS 限制）
- ⚠️ 公司分析可能無法正常運作（CORS 限制）

## 使用方式

1. 輸入搜尋關鍵字
2. 選擇性輸入 Gemini API Key
3. 點擊「開始搜尋」

## 技術說明

此版本使用直接 API 呼叫，可能受到瀏覽器 CORS 政策限制。
建議使用 Vercel 版本以獲得完整功能。

## 部署資訊

- 部署時間：$(date)
- 分支：gh-pages
- 版本：GitHub Pages 專用版本
EOF

# 建立 .nojekyll 檔案（避免 Jekyll 處理）
echo "🔧 建立 .nojekyll 檔案..."
touch .nojekyll

# 提交變更
echo "💾 提交變更..."
git add .
git commit -m "📄 新增 GitHub Pages 版本

- 使用 index-github.html 作為主頁面
- 建立 GitHub Pages 專用的公司分析頁面
- 新增 .nojekyll 檔案避免 Jekyll 處理
- 建立 GitHub Pages 專用 README

注意：此版本可能受到 CORS 限制影響
建議使用 Vercel 版本以獲得最佳體驗"

# 推送到 GitHub
echo "🚀 推送到 GitHub..."
git push origin gh-pages

echo "✅ GitHub Pages 部署設定完成！"
echo ""
echo "📋 下一步："
echo "1. 前往 GitHub Repository 的 Settings"
echo "2. 滾動到 Pages 區段"
echo "3. 在 Source 選擇 'Deploy from a branch'"
echo "4. 選擇 'gh-pages' 分支和 '/ (root)' 資料夾"
echo "5. 點擊 Save"
echo ""
echo "🌐 部署完成後，您的網站將出現在："
echo "https://yourusername.github.io/taiwan-government-procurement-ai"
echo ""
echo "⚠️ 注意：GitHub Pages 版本可能受到 CORS 限制影響"
echo "建議使用 Vercel 版本以獲得最佳體驗"
