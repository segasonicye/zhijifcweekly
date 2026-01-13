@echo off
echo === Netlify 自动部署 ===
echo.
echo 正在生成HTML文件...
call node scripts/matches-view.js
call node scripts/preview.js "2026-01-09-内战"
call node scripts/preview.js "2026-01-03-党校队"
call node scripts/preview.js "2026-01-01-三海风"
echo.
echo HTML文件生成完成!
echo.
echo 正在部署到Netlify...
echo.
npx netlify deploy --prod --dir=output
echo.
echo 部署完成!
echo.
pause
