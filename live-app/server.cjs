const http=require('http'),fs=require('fs'),path=require('path');
const PORT=8080,DIR=__dirname,DATA=path.join(DIR,'data');
const mime={'html':'text/html;charset=utf-8','js':'application/javascript','css':'text/css','json':'application/json','manifest':'application/manifest+json','svg':'image/svg+xml','png':'image/png','webmanifest':'application/manifest+json'};

// ---------- 数据持久化 ----------
function readJson(file,def){
  try{return JSON.parse(fs.readFileSync(path.join(DATA,file),'utf8'))}catch(e){return def}
}
function writeJson(file,data){
  fs.mkdirSync(DATA,{recursive:true});
  const tmp=path.join(DATA,file+'.tmp');
  fs.writeFileSync(tmp,JSON.stringify(data,null,2),'utf8');
  fs.renameSync(tmp,path.join(DATA,file));
}
function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}

// ---------- 工具 ----------
function sendJson(res,code,obj){
  res.writeHead(code,{'Content-Type':'application/json;charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
  res.end(JSON.stringify(obj));
}
function parseBody(req,cb){
  let body='';
  let tooLarge=false;
  req.on('data',chunk=>{
    body+=chunk;
    if(body.length>100*1024){tooLarge=true;req.destroy();}
  });
  req.on('end',()=>{
    if(tooLarge)return cb({});
    try{cb(JSON.parse(body||'{}'))}catch(e){cb({})}
  });
  req.on('error',()=>cb({}));
}
function str(v){return typeof v==='string'?v.trim():''}
function clamp(v,max){return v.length>max?v.substring(0,max):v}

// ---------- 树洞操作 ----------
function treeholeStore(){
  const posts=readJson('treehole.json',[]);
  return posts;
}
function pinHandler(posts,id){ // id 幂等：置顶的帖子里若有该 id 则取消置顶
  const p=posts.find(x=>x.id===id);
  if(!p)return false;
  p.pinned=p.pinned?false:true;
  return true;
}

// ---------- 静态文件服务 ----------
function serveStatic(req,res){
  let fp=path.join(DIR,req.url==='/'?'/index.html':req.url);
  fs.readFile(fp,(err,data)=>{
    if(err){res.writeHead(404);res.end('Not Found');return}
    const base=path.basename(fp);
    const ext=path.extname(fp).slice(1);
    let ct=mime[ext]||'text/plain';
    if(base==='manifest.json')ct='application/manifest+json';
    res.writeHead(200,{'Content-Type':ct,'Access-Control-Allow-Origin':'*'});
    res.end(data);
  });
}

http.createServer((req,res)=>{
  const url=req.url.split('?')[0];

  // ---------- CORS 预检 ----------
  if(req.method==='OPTIONS'){
    res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
    res.end();return;
  }

  // ---------- 用户计数 ----------
  if(req.method==='GET'&&url==='/api/counter'){
    const counter=readJson('counter.json',{count:0,lastAnon:0});
    const uq=req.url.split('?')[1]||'';
    const userId=(uq.match(/userId=([^&]+)/)||[])[1]||null;
    if(!userId){counter.count+=1;}
    counter.lastAnon=counter.lastAnon||0;
    const uid=userId||genId();
    writeJson('counter.json',counter);
    sendJson(res,200,{count:counter.count,userId:uid});
    return;
  }

  // ---------- 树洞：GET 列表 / POST 发帖 ----------
  if(url==='/api/treehole'){
    if(req.method==='GET'){
      const counter=readJson('counter.json',{count:0,lastAnon:0});
      const posts=treeholeStore();
      const sorted=posts.slice().sort(function(a,b){return (b.pinned?1:0)-(a.pinned?1:0)});
      sendJson(res,200,{posts:sorted,anonSeq:counter.lastAnon});
      return;
    }
    if(req.method==='POST'){
      parseBody(req,body=>{
        const content=clamp(str(body.content),500);
        const category=clamp(str(body.category),8)||'疑问';
        if(!content){sendJson(res,400,{ok:false,error:'内容不能为空'});return;}
        const validCat=['经验','互助','吐槽','疑问'];
        const cat=validCat.indexOf(category)>-1?category:'疑问';
        const posts=treeholeStore();
        const counter=readJson('counter.json',{count:0,lastAnon:0});
        counter.lastAnon=(counter.lastAnon||0)+1;
        writeJson('counter.json',counter);
        const post={id:genId(),content,category:cat,aid:'匿名'+String(counter.lastAnon).padStart(4,'0'),created_at:new Date().toLocaleString('zh-CN'),likes:[],replies:[],pinned:false,reports:0};
        posts.unshift(post);
        writeJson('treehole.json',posts);
        sendJson(res,200,{ok:true,post});
      });
      return;
    }
  }

  // ---------- 树洞子操作：like/reply/pin/report ----------
  const m=url.match(/^\/api\/treehole\/([^/]+)\/(like|reply|pin|report)$/);
  if(m&&req.method==='POST'){
    const id=m[1],action=m[2];
    parseBody(req,body=>{
      const posts=treeholeStore();
      const post=posts.find(x=>x.id===id);
      if(!post){sendJson(res,404,{ok:false,error:'帖子不存在'});return;}
      if(action==='like'){
        const userId=clamp(str(body.userId),64);
        const i=post.likes.indexOf(userId);
        if(i>-1)post.likes.splice(i,1);else post.likes.push(userId);
      }else if(action==='reply'){
        const content=clamp(str(body.content),200);
        const aid=clamp(str(body.aid),20)||'匿名';
        if(!content){sendJson(res,400,{ok:false,error:'回复不能为空'});return;}
        post.replies.push({id:genId(),content,aid,created_at:new Date().toLocaleString('zh-CN')});
      }else if(action==='pin'){
        pinHandler(posts,id);
      }else if(action==='report'){
        post.reports=(post.reports||0)+1;
      }
      writeJson('treehole.json',posts);
      sendJson(res,200,{ok:true,post});
    });
    return;
  }

  // ---------- 数据纠错 ----------
  if(req.method==='POST'&&url==='/api/feedback'){
    parseBody(req,body=>{
      const schoolName=clamp(str(body.schoolName),50);
      const schoolId=clamp(str(body.schoolId),20);
      const field=clamp(str(body.field),20)||'其他';
      const detail=clamp(str(body.detail),1000);
      const contact=clamp(str(body.contact),50);
      if(!detail){sendJson(res,400,{ok:false,error:'描述不能为空'});return;}
      const feedbacks=readJson('feedback.json',[]);
      feedbacks.unshift({id:genId(),schoolId,schoolName,field,detail,contact,created_at:new Date().toLocaleString('zh-CN')});
      writeJson('feedback.json',feedbacks);
      sendJson(res,200,{ok:true,id:feedbacks[0].id});
    });
    return;
  }

  // ---------- 静态文件 ----------
  serveStatic(req,res);
}).listen(PORT,()=>{
  fs.mkdirSync(DATA,{recursive:true});
  console.log('Server: http://localhost:'+PORT);
});
