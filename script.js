class WatermarkRemover {
    constructor() {
        this.init();
        this.isProcessing = false;
        this.verifyCompleted = false;
    }

    init() {
        this.bindEvents();
        this.initSliderVerify();
    }

    bindEvents() {
        const urlInput = document.getElementById('videoUrl');
        const removeBtn = document.getElementById('removeBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const closeBtn = document.querySelector('.close-btn');

        urlInput.addEventListener('input', this.handleUrlInput.bind(this));
        urlInput.addEventListener('paste', this.handleUrlPaste.bind(this));
        removeBtn.addEventListener('click', this.handleRemoveClick.bind(this));
        downloadBtn.addEventListener('click', this.handleDownload.bind(this));
        closeBtn.addEventListener('click', this.closeVerifyModal.bind(this));

        // 阻止表单默认提交
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!removeBtn.disabled) {
                    this.handleRemoveClick();
                }
            }
        });
    }

    handleUrlInput(e) {
        const url = e.target.value.trim();
        const removeBtn = document.getElementById('removeBtn');
        
        if (this.isValidUrl(url)) {
            removeBtn.disabled = false;
            removeBtn.style.background = 'linear-gradient(135deg, #007aff 0%, #0051d5 100%)';
        } else {
            removeBtn.disabled = true;
            removeBtn.style.background = '#e5e5e7';
        }

        this.hideError();
    }

    handleUrlPaste(e) {
        setTimeout(() => {
            this.handleUrlInput(e);
        }, 10);
    }

    isValidUrl(url) {
        if (!url) return false;
        
        const patterns = [
            /douyin\.com/,
            /v\.douyin\.com/,
            /kuaishou\.com/,
            /xiaohongshu\.com/,
            /xhslink\.com/,
            /bilibili\.com/,
            /weibo\.com/
        ];

        return patterns.some(pattern => pattern.test(url));
    }

    async handleRemoveClick() {
        if (this.isProcessing) return;

        const url = document.getElementById('videoUrl').value.trim();
        if (!this.isValidUrl(url)) {
            this.showError('请输入有效的视频链接');
            return;
        }

        this.showVerifyModal();
    }

    showVerifyModal() {
        const modal = document.getElementById('verifyModal');
        modal.classList.add('show');
        this.resetSlider();
    }

    closeVerifyModal() {
        const modal = document.getElementById('verifyModal');
        modal.classList.remove('show');
        this.verifyCompleted = false;
    }

    initSliderVerify() {
        const slider = document.querySelector('.slider-thumb');
        const track = document.querySelector('.slider-track');
        const fill = document.querySelector('.slider-fill');
        
        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        let maxX = 0;

        const updateMaxX = () => {
            maxX = track.offsetWidth - slider.offsetWidth;
        };

        const updateSlider = (x) => {
            const progress = Math.min(Math.max(x / maxX, 0), 1);
            const translateX = progress * maxX;
            
            slider.style.transform = `translateX(${translateX}px)`;
            fill.style.width = `${progress * 100}%`;
            
            if (progress > 0.95) {
                this.completeVerify();
            }
        };

        const handleStart = (e) => {
            isDragging = true;
            updateMaxX();
            startX = (e.touches ? e.touches[0].clientX : e.clientX) - currentX;
            slider.style.transition = 'none';
            fill.style.transition = 'none';
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            currentX = Math.min(Math.max(clientX - startX, 0), maxX);
            updateSlider(currentX);
        };

        const handleEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            slider.style.transition = 'all 0.3s ease';
            fill.style.transition = 'width 0.3s ease';
            
            if (currentX < maxX * 0.95) {
                currentX = 0;
                updateSlider(0);
            }
        };

        // 鼠标事件
        slider.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);

        // 触摸事件
        slider.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);

        // 窗口大小改变时更新最大值
        window.addEventListener('resize', updateMaxX);
        updateMaxX();
    }

    resetSlider() {
        const slider = document.querySelector('.slider-thumb');
        const fill = document.querySelector('.slider-fill');
        
        slider.style.transform = 'translateX(0)';
        fill.style.width = '0%';
        this.verifyCompleted = false;
    }

    completeVerify() {
        if (this.verifyCompleted) return;
        
        this.verifyCompleted = true;
        const slider = document.querySelector('.slider-thumb');
        const text = document.querySelector('.slider-text');
        
        slider.style.background = '#34c759';
        slider.style.color = 'white';
        slider.innerHTML = '✓';
        text.textContent = '验证成功！';
        text.style.color = '#34c759';

        setTimeout(() => {
            this.closeVerifyModal();
            this.processVideo();
        }, 800);
    }

    async processVideo() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.setLoadingState(true);
        this.hideError();
        this.hideResult();

        try {
            const url = document.getElementById('videoUrl').value.trim();
            console.log('开始处理视频:', url);
            
            const result = await this.callAPI(url);
            console.log('API调用结果:', result);
            
            if (result.success) {
                console.log('解析成功，显示结果:', result.data);
                this.showResult(result.data);
            } else {
                console.log('解析失败:', result.message);
                this.showError(result.message || '解析失败，请重试');
            }
        } catch (error) {
            console.error('处理视频出错:', error);
            this.showError('网络错误，请检查网络连接后重试');
        } finally {
            this.isProcessing = false;
            this.setLoadingState(false);
        }
    }

    async callAPI(videoUrl) {
        // 尝试多种方法调用API
        
        // 方法1: 使用公开的CORS代理服务
        const proxyUrls = [
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        const apiUrl = 'https://api.guijianpan.com/waterRemoveDetail/xxmQsyByAk';
        const params = new URLSearchParams({
            ak: '31f90c09b9ab4d0daa8a6a957f12a021',
            link: videoUrl
        });
        
        const targetUrl = `${apiUrl}?${params}`;
        
        // 首先尝试直接调用（可能被CORS阻止）
        try {
            const response = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                mode: 'cors'
            });

            if (response.ok) {
                const data = await response.json();
                return this.parseApiResponse(data);
            }
        } catch (corsError) {
            console.log('Direct API call failed, trying proxy methods...');
        }
        
        // 方法2: 尝试CORS代理
        for (const proxyUrl of proxyUrls) {
            try {
                const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return this.parseApiResponse(data);
                }
            } catch (error) {
                console.log(`Proxy ${proxyUrl} failed:`, error);
                continue;
            }
        }
        
        // 方法3: 使用JSONP (如果API支持)
        try {
            return await this.callAPIWithJSONP(targetUrl);
        } catch (jsonpError) {
            console.log('JSONP failed:', jsonpError);
        }
        
        // 所有方法都失败了
        throw new Error('所有API调用方法都失败了，可能是网络问题或CORS限制');
    }
    
    parseApiResponse(data) {
        // 处理不同的API响应格式
        if (data.code === "10000" && data.content) {
            // 新的响应格式
            return {
                success: true,
                data: {
                    title: data.content.title || '未知标题',
                    author: data.content.author || '未知作者',
                    thumbnail: data.content.cover || '',
                    downloadUrl: data.content.url || '',
                    duration: data.content.duration || '',
                    size: data.content.size || ''
                }
            };
        } else if (data.code === 200 && data.data) {
            // 旧的响应格式
            return {
                success: true,
                data: {
                    title: data.data.title || '未知标题',
                    author: data.data.author || '未知作者',
                    thumbnail: data.data.cover || '',
                    downloadUrl: data.data.url || data.data.videoUrl,
                    duration: data.data.duration || '',
                    size: data.data.size || ''
                }
            };
        } else {
            return {
                success: false,
                message: data.msg || data.message || '解析失败'
            };
        }
    }
    
    callAPIWithJSONP(url) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_callback_' + Date.now();
            const script = document.createElement('script');
            
            window[callbackName] = function(data) {
                document.head.removeChild(script);
                delete window[callbackName];
                resolve(data);
            };
            
            script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
            script.onerror = function() {
                document.head.removeChild(script);
                delete window[callbackName];
                reject(new Error('JSONP request failed'));
            };
            
            document.head.appendChild(script);
            
            // 超时处理
            setTimeout(() => {
                if (window[callbackName]) {
                    document.head.removeChild(script);
                    delete window[callbackName];
                    reject(new Error('JSONP request timeout'));
                }
            }, 15000);
        });
    }

    setLoadingState(loading) {
        const removeBtn = document.getElementById('removeBtn');
        const btnText = removeBtn.querySelector('.btn-text');
        
        if (loading) {
            removeBtn.classList.add('loading');
            removeBtn.disabled = true;
            btnText.textContent = '解析中...';
        } else {
            removeBtn.classList.remove('loading');
            removeBtn.disabled = false;
            btnText.textContent = '开始去水印';
        }
    }

    showResult(data) {
        const resultSection = document.getElementById('resultSection');
        const videoThumb = document.getElementById('videoThumb');
        const videoTitle = document.getElementById('videoTitle');
        const videoAuthor = document.getElementById('videoAuthor');
        const downloadBtn = document.getElementById('downloadBtn');

        // 存储当前视频数据
        this.currentVideoData = data;

        videoTitle.textContent = data.title || '未知视频标题';
        videoAuthor.textContent = `作者: ${data.author || '未知作者'}`;
        
        console.log('缩略图URL:', data.thumbnail);
        
        // 处理缩略图显示
        if (data.thumbnail && data.thumbnail.trim()) {
            videoThumb.src = data.thumbnail;
            videoThumb.style.display = 'block';
            
            // 添加图片加载失败处理
            videoThumb.onerror = () => {
                console.log('缩略图加载失败，使用默认图片');
                videoThumb.style.display = 'none';
                this.showDefaultThumbnail();
            };
            
            videoThumb.onload = () => {
                console.log('缩略图加载成功');
            };
        } else {
            console.log('无缩略图URL，显示默认缩略图');
            this.showDefaultThumbnail();
        }

        downloadBtn.onclick = () => this.downloadVideo(data.downloadUrl, data.title);
        
        resultSection.classList.add('show');
        
        // 平滑滚动到结果区域
        setTimeout(() => {
            resultSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    showDefaultThumbnail() {
        const videoThumb = document.getElementById('videoThumb');
        const thumbnailContainer = document.querySelector('.video-thumbnail');
        
        if (thumbnailContainer) {
            // 创建默认缩略图
            thumbnailContainer.innerHTML = `
                <div class="default-thumbnail">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                    <span class="thumbnail-text">视频</span>
                </div>
            `;
        }
    }

    hideResult() {
        const resultSection = document.getElementById('resultSection');
        resultSection.classList.remove('show');
    }

    async downloadVideo(url, filename) {
        try {
            const downloadBtn = document.getElementById('downloadBtn');
            const originalText = downloadBtn.querySelector('span').textContent;
            
            downloadBtn.querySelector('span').textContent = '准备下载...';
            downloadBtn.disabled = true;

            // 检测设备类型
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // 由于403权限问题，改用代理下载或直接复制链接的方式
            if (isMobile) {
                // 移动端：显示下载指南
                this.showMobileDownloadGuide(url);
            } else {
                // 桌面端：尝试代理下载或复制链接
                this.showDesktopDownloadOptions(url, filename);
            }
            
            downloadBtn.querySelector('span').textContent = originalText;
            downloadBtn.disabled = false;

        } catch (error) {
            console.error('下载出错:', error);
            this.showError('下载准备失败，请重试');
            
            const downloadBtn = document.getElementById('downloadBtn');
            downloadBtn.querySelector('span').textContent = '下载无水印视频';
            downloadBtn.disabled = false;
        }
    }

    showMobileDownloadGuide(url) {
        // 创建移动端下载指南弹窗
        const modal = document.createElement('div');
        modal.className = 'download-guide-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📱 移动端下载指南</h3>
                        <button class="close-btn" onclick="this.closest('.download-guide-modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="download-steps">
                            <div class="step">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <p><strong>复制视频链接</strong></p>
                                    <div class="video-url-box">
                                        <input type="text" value="${url}" readonly id="videoUrlToCopy">
                                        <button onclick="this.previousElementSibling.select();document.execCommand('copy');this.textContent='已复制!';setTimeout(()=>this.textContent='复制',1000)">复制</button>
                                    </div>
                                </div>
                            </div>
                            <div class="step">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <p><strong>打开浏览器新标签页</strong></p>
                                    <p class="step-desc">粘贴链接到地址栏访问</p>
                                </div>
                            </div>
                            <div class="step">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <p><strong>长按视频保存</strong></p>
                                    <p class="step-desc">视频播放后，长按选择"保存视频"</p>
                                </div>
                            </div>
                        </div>
                        <div class="quick-actions">
                            <button class="action-btn primary" onclick="window.open('${url}', '_blank')">
                                🚀 直接打开视频
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // 自动选中URL输入框
        setTimeout(() => {
            const urlInput = document.getElementById('videoUrlToCopy');
            if (urlInput) urlInput.select();
        }, 100);
    }

    showDesktopDownloadOptions(url, filename) {
        // 桌面端下载选项
        const modal = document.createElement('div');
        modal.className = 'download-guide-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>💻 下载选项</h3>
                        <button class="close-btn" onclick="this.closest('.download-guide-modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="download-options">
                            <div class="option">
                                <h4>方法一：右键保存</h4>
                                <p>点击下方按钮打开视频，然后右键选择"另存为"</p>
                                <button class="action-btn primary" onclick="window.open('${url}', '_blank')">
                                    🎥 打开视频页面
                                </button>
                            </div>
                            <div class="option">
                                <h4>方法二：复制链接</h4>
                                <p>复制链接到下载工具（如IDM、迅雷等）</p>
                                <div class="video-url-box">
                                    <input type="text" value="${url}" readonly id="desktopVideoUrl">
                                    <button onclick="this.previousElementSibling.select();document.execCommand('copy');this.textContent='已复制!';setTimeout(()=>this.textContent='复制',1000)">复制链接</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showDownloadTip(isMobile) {
        const tip = document.createElement('div');
        tip.className = 'download-tip';
        tip.innerHTML = isMobile 
            ? '📱 移动端：长按视频保存到相册' 
            : '💻 下载已开始，请查看浏览器下载文件夹';
        
        tip.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(52, 199, 89, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 2000;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(tip);
        
        setTimeout(() => {
            tip.style.animation = 'slideUp 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(tip);
            }, 300);
        }, 3000);
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = errorMessage.querySelector('.error-text');
        
        errorText.textContent = message;
        errorMessage.classList.add('show');
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.classList.remove('show');
    }

    handleDownload() {
        const downloadUrl = this.currentVideoData?.downloadUrl;
        const title = this.currentVideoData?.title;
        
        if (downloadUrl) {
            this.downloadVideo(downloadUrl, title);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.watermarkRemover = new WatermarkRemover();
    
    // 添加下载提示动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(0); opacity: 1; }
            to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        }
        .download-tip {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(10px);
        }
    `;
    document.head.appendChild(style);
});

// 防止页面刷新时丢失输入内容
window.addEventListener('beforeunload', (e) => {
    const urlInput = document.getElementById('videoUrl');
    if (urlInput.value.trim()) {
        localStorage.setItem('videoUrl', urlInput.value.trim());
    }
});

// 页面加载时恢复输入内容
window.addEventListener('load', () => {
    const savedUrl = localStorage.getItem('videoUrl');
    if (savedUrl) {
        const urlInput = document.getElementById('videoUrl');
        urlInput.value = savedUrl;
        
        const event = new Event('input');
        urlInput.dispatchEvent(event);
        
        localStorage.removeItem('videoUrl');
    }
});