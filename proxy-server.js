// 简单的代理服务器解决CORS问题
const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, User-Agent');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'GET' && req.url.startsWith('/api/')) {
    // 提取查询参数
    const parsedUrl = url.parse(req.url, true);
    const { ak, link } = parsedUrl.query;
    
    if (!ak || !link) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing ak or link parameter' }));
      return;
    }
    
    // 构建目标API URL
    const targetUrl = `https://api.guijianpan.com/waterRemoveDetail/xxmQsyByAk?ak=${encodeURIComponent(ak)}&link=${encodeURIComponent(link)}`;
    
    // 代理请求到目标API
    const apiReq = https.get(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (apiRes) => {
      res.writeHead(apiRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      
      apiRes.pipe(res);
    });
    
    apiReq.on('error', (error) => {
      console.error('API Request Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API request failed', details: error.message }));
    });
    
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`代理服务器运行在端口 ${PORT}`);
  console.log(`使用方式: http://localhost:${PORT}/api/?ak=YOUR_API_KEY&link=VIDEO_URL`);
});

module.exports = server;