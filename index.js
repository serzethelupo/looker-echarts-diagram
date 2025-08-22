(function(){
  function draw(){
    var r=document.getElementById('root');
    if(!r){r=document.createElement('div');r.id='root';r.style.width='100%';r.style.height='100%';document.body.appendChild(r);}
    r.innerHTML='<div style="padding:12px;font:14px/1.4 system-ui,sans-serif">✅ Manifest loaded. Now we can switch to ECharts.</div>';
  }
  if(window.dscc){dscc.subscribeToData(draw,{transform:dscc.tableTransform});}else{draw();}
})();
