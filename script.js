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
            const result = await this.callAPI(url);
            
            if (result.success) {
                this.showResult(result.data);
            } else {
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
        const apiUrl = 'https://api.guijianpan.com/waterRemoveDetail/xxmQsyByAk';
        const params = new URLSearchParams({
            ak: '31f90c09b9ab4d0daa8a6a957f12a021',
            link: videoUrl
        });

        const response = await fetch(`${apiUrl}?${params}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.code === 200 && data.data) {
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
                message: data.msg || '解析失败'
            };
        }
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

        videoTitle.textContent = data.title;
        videoAuthor.textContent = `作者: ${data.author}`;
        
        if (data.thumbnail) {
            videoThumb.src = data.thumbnail;
            videoThumb.style.display = 'block';
        } else {
            videoThumb.style.display = 'none';
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

    hideResult() {
        const resultSection = document.getElementById('resultSection');
        resultSection.classList.remove('show');
    }

    async downloadVideo(url, filename) {
        try {
            const downloadBtn = document.getElementById('downloadBtn');
            const originalText = downloadBtn.querySelector('span').textContent;
            
            downloadBtn.querySelector('span').textContent = '下载中...';
            downloadBtn.disabled = true;

            // 检测设备类型
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // 移动端：直接打开链接，让浏览器处理下载
                window.open(url, '_blank');
            } else {
                // 桌面端：创建下载链接
                const link = document.createElement('a');
                link.href = url;
                link.download = `${filename || '无水印视频'}.mp4`;
                link.target = '_blank';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // 显示下载提示
            this.showDownloadTip(isMobile);
            
            downloadBtn.querySelector('span').textContent = originalText;
            downloadBtn.disabled = false;

        } catch (error) {
            console.error('下载出错:', error);
            this.showError('下载失败，请重试或右键保存视频');
            
            const downloadBtn = document.getElementById('downloadBtn');
            downloadBtn.querySelector('span').textContent = '下载无水印视频';
            downloadBtn.disabled = false;
        }
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
    new WatermarkRemover();
    
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