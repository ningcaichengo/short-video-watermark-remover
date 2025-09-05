@echo off
echo ========================================
echo 短视频去水印网站部署脚本
echo ========================================
echo.

:: 检查是否在项目目录
if not exist "index.html" (
    echo 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

:: 初始化git仓库
echo [1/5] 初始化Git仓库...
git init
if errorlevel 1 (
    echo Git初始化失败，请检查Git是否已安装
    pause
    exit /b 1
)

:: 添加所有文件
echo [2/5] 添加项目文件...
git add .

:: 创建初始提交
echo [3/5] 创建提交...
git commit -m "初始化短视频去水印项目 - 完整功能实现

功能特性:
- 苹果极简设计风格
- 移动端一屏操作优化  
- 滑动验证码防爬虫
- 多平台视频链接支持
- 智能下载功能
- 完整测试用例

技术栈:
- HTML5/CSS3/JavaScript
- 响应式设计
- RESTful API集成

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

if errorlevel 1 (
    echo 提交失败，请检查文件状态
    pause
    exit /b 1
)

:: 设置主分支
echo [4/5] 设置主分支...
git branch -M main

echo [5/5] Git仓库初始化完成！
echo.
echo ========================================
echo 下一步：GitHub部署
echo ========================================
echo.
echo 1. 在GitHub创建新仓库：short-video-watermark-remover
echo 2. 复制仓库地址，例如：https://github.com/username/short-video-watermark-remover.git  
echo 3. 运行以下命令推送代码：
echo.
echo    git remote add origin [你的仓库地址]
echo    git push -u origin main
echo.
echo 4. 在GitHub仓库设置中启用Pages功能
echo    - Settings → Pages
echo    - Source: Deploy from a branch
echo    - Branch: main / (root)
echo.
echo 5. 等待几分钟后访问你的网站！
echo.
echo ========================================
pause