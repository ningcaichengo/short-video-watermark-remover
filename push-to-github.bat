@echo off
echo ========================================
echo GitHub 推送脚本
echo ========================================
echo.

:: 提示用户输入仓库地址
set /p REPO_URL="请输入GitHub仓库地址（例如：https://github.com/username/short-video-watermark-remover.git）: "

if "%REPO_URL%"=="" (
    echo 错误：请输入有效的仓库地址
    pause
    exit /b 1
)

echo.
echo [1/2] 添加远程仓库...
git remote add origin %REPO_URL%

if errorlevel 1 (
    echo 远程仓库添加失败，可能已存在，尝试更新...
    git remote set-url origin %REPO_URL%
)

echo [2/2] 推送代码到GitHub...
git push -u origin main

if errorlevel 1 (
    echo 推送失败，请检查：
    echo 1. GitHub仓库地址是否正确
    echo 2. 是否有推送权限
    echo 3. 网络连接是否正常
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 代码推送成功！
echo ========================================
echo.
echo 下一步：启用GitHub Pages
echo.
echo 1. 打开你的GitHub仓库页面
echo 2. 点击 Settings（设置）
echo 3. 在左侧菜单找到 Pages
echo 4. Source 选择：Deploy from a branch
echo 5. Branch 选择：main
echo 6. Folder 选择：/ (root)
echo 7. 点击 Save（保存）
echo.
echo 等待2-3分钟后，你的网站将在以下地址可用：
echo https://你的用户名.github.io/short-video-watermark-remover
echo.
pause