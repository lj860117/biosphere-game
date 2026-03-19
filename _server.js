const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const mime = {'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'};
http.createServer(function(req, res){
  let u = decodeURIComponent(req.url.split('?')[0]);
  if(u === '/') u = '/index.html';
  const fp = path.join(dir, u);
  if(!fp.startsWith(dir)){ res.writeHead(403); return res.end(); }
  fs.readFile(fp, function(err, data){
    if(err){ res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, {'Content-Type': mime[ext]||'application/octet-stream','Cache-Control':'no-cache,no-store,must-revalidate'});
    res.end(data);
  });
}).listen(8888, function(){ console.log('http://localhost:8888'); });
