import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const canvas=document.getElementById('c'), loader=document.getElementById('loader');
const geoCard=document.getElementById('geoCard');
const gcLabel=document.getElementById('gcLabel'),gcVal=document.getElementById('gcVal'),gcDesc=document.getElementById('gcDesc'),gcIcon=document.getElementById('gcIcon');
const stage=canvas.parentElement;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
function sz(){return {w:stage.clientWidth,h:stage.clientHeight};}
renderer.setSize(sz().w,sz().h);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,sz().w/sz().h,0.1,1000);
camera.position.z=6.2;
const R=1.0, globeGroup=new THREE.Group(); globeGroup.position.y=-0.95; scene.add(globeGroup);
const mgr=new THREE.LoadingManager(); mgr.onLoad=()=>loader.classList.add('hide');
const tl=new THREE.TextureLoader(mgr);
const dayTex=tl.load('earth-day.jpg'), nightTex=tl.load('earth-night.jpg');
dayTex.colorSpace=THREE.SRGBColorSpace; nightTex.colorSpace=THREE.SRGBColorSpace;
const globeMat=new THREE.ShaderMaterial({
  uniforms:{dayMap:{value:dayTex},nightMap:{value:nightTex},sunDir:{value:new THREE.Vector3(-3,1.2,4).normalize()}},
  vertexShader:`varying vec2 vUv; varying vec3 vNormal; void main(){ vUv=uv; vNormal=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform sampler2D dayMap; uniform sampler2D nightMap; uniform vec3 sunDir; varying vec2 vUv; varying vec3 vNormal;
    void main(){ float in0=dot(normalize(vNormal),normalize(sunDir)); float m=smoothstep(-0.25,0.25,in0);
      vec3 day=texture2D(dayMap,vUv).rgb; vec3 night=texture2D(nightMap,vUv).rgb*1.5; gl_FragColor=vec4(mix(night,day,m),1.0);}`,
});
globeGroup.add(new THREE.Mesh(new THREE.SphereGeometry(R,128,128),globeMat));
const atmMat=new THREE.ShaderMaterial({
  vertexShader:`varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec3 vN; void main(){ float i=pow(0.58-dot(vN,vec3(0,0,1.0)),2.8)*0.6; gl_FragColor=vec4(0.0,0.85,0.9,1.0)*i;}`,
  blending:THREE.AdditiveBlending,side:THREE.BackSide,transparent:true});
  const atm=new THREE.Mesh(new THREE.SphereGeometry(R*1.15,128,128),atmMat); atm.position.y=-0.95; scene.add(atm);
const sg=new THREE.BufferGeometry(),sv=[];
for(let i=0;i<3500;i++){const r=60+Math.random()*200,th=Math.random()*6.28,ph=Math.acos(2*Math.random()-1);
  sv.push(r*Math.sin(ph)*Math.cos(th),r*Math.sin(ph)*Math.sin(th),r*Math.cos(ph));}
sg.setAttribute('position',new THREE.Float32BufferAttribute(sv,3));
scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:0.7,transparent:true,opacity:0.7})));
const hotspots=[
  {lat:-33.8,lon:151.2,label:'Total Units',val:'231,373',desc:'Produced 2021–2025',icon:'🏭'},
  {lat:51.5,lon:-0.12,label:'Defect Rate',val:'3.62%',desc:'Target ≤ 3.50%',icon:'🎯'},
  {lat:35.6,lon:139.7,label:'DPMO',val:'36,156',desc:'Defects per million',icon:'📉'},
  {lat:40.7,lon:-74.0,label:'Sigma Level',val:'3.30σ',desc:'Industry avg 3–4σ',icon:'📐'},
  {lat:48.8,lon:2.35,label:'Process Yield',val:'96.38%',desc:'Best year 96.56%',icon:'✅'},
  {lat:1.35,lon:103.8,label:'Anomalies',val:'60',desc:'Found by ML',icon:'🔍'},
  {lat:-23.5,lon:-46.6,label:'Machines',val:'20',desc:'Across 3 shifts',icon:'⚙️'},
  {lat:28.6,lon:77.2,label:'Years of Data',val:'5',desc:'2021 – 2025',icon:'📅'},
];
function latLon(lat,lon,r){const phi=(90-lat)*Math.PI/180,th=(lon+180)*Math.PI/180;
  return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(th),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(th));}
const markers=[];
hotspots.forEach(h=>{const pos=latLon(h.lat,h.lon,R+0.012);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.016,0.026,28),new THREE.MeshBasicMaterial({color:0x00f5d4,transparent:true,opacity:0.85,side:THREE.DoubleSide}));
  ring.position.copy(pos);ring.lookAt(pos.clone().multiplyScalar(2));globeGroup.add(ring);
  const dot=new THREE.Mesh(new THREE.SphereGeometry(0.011,16,16),new THREE.MeshBasicMaterial({color:0x00f5d4}));
  dot.position.copy(pos);globeGroup.add(dot);
  markers.push({...h,pos,ring,ringMat:ring.material});});
function arc(a,b){const s=latLon(a.lat,a.lon,R+0.012),e=latLon(b.lat,b.lon,R+0.012);
  const m=s.clone().add(e).multiplyScalar(0.5);const d=s.distanceTo(e);m.normalize().multiplyScalar(R+d*0.4);
  const pts=new THREE.QuadraticBezierCurve3(s,m,e).getPoints(50);
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x00d4c4,transparent:true,opacity:0.3}));}
for(let i=0;i<hotspots.length;i++)globeGroup.add(arc(hotspots[i],hotspots[(i+2)%hotspots.length]));
let dragging=false,prev={x:0,y:0},vel={x:0,y:0},auto=true;
function stt(x,y){dragging=true;auto=false;prev={x,y};vel={x:0,y:0};}
function mv(x,y){if(!dragging)return;const dx=(x-prev.x)*0.005,dy=(y-prev.y)*0.005;vel={x:dy,y:dx};
  globeGroup.rotation.y+=dx;globeGroup.rotation.x=Math.max(-0.6,Math.min(0.6,globeGroup.rotation.x+dy));prev={x,y};}
function en(){dragging=false;setTimeout(()=>auto=true,3500);}
canvas.addEventListener('mousedown',e=>stt(e.clientX,e.clientY));
window.addEventListener('mousemove',e=>mv(e.clientX,e.clientY));
window.addEventListener('mouseup',en);
canvas.addEventListener('touchstart',e=>stt(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
canvas.addEventListener('touchmove',e=>mv(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
canvas.addEventListener('touchend',en);
window.addEventListener('resize',()=>{camera.aspect=sz().w/sz().h;camera.updateProjectionMatrix();renderer.setSize(sz().w,sz().h);});
let t=0;const tmp=new THREE.Vector3();
function animate(){
  requestAnimationFrame(animate);t+=0.01;
  if(auto&&!dragging)globeGroup.rotation.y+=0.0011;
  if(!dragging){vel.x*=0.94;vel.y*=0.94;
    if(Math.abs(vel.y)>0.0001){globeGroup.rotation.y+=vel.y;globeGroup.rotation.x=Math.max(-0.6,Math.min(0.6,globeGroup.rotation.x+vel.x));}}
  markers.forEach((m,i)=>{const p=0.5+0.5*Math.sin(t*1.8+i*0.7);m.ringMat.opacity=0.35+p*0.5;const sc=1+p*0.4;m.ring.scale.set(sc,sc,1);});
  let best=null,bestZ=-Infinity;
  markers.forEach(m=>{tmp.copy(m.pos);tmp.applyMatrix4(globeGroup.matrixWorld);
    const ndc=tmp.clone().project(camera);
    if(tmp.z>bestZ&&ndc.x>-0.8&&ndc.x<0.8){bestZ=tmp.z;best={m,ndc,facing:tmp.z};}});
  if(best&&best.facing>0.25){
    const sx=(best.ndc.x*0.5+0.5)*sz().w, sy=(-best.ndc.y*0.5+0.5)*sz().h;
    geoCard.style.opacity=Math.min(1,(best.facing-0.25)/0.5);
    geoCard.style.left=Math.min(sz().w-220,Math.max(10,sx+22))+'px';
    geoCard.style.top=Math.min(sz().h-110,Math.max(20,sy-30))+'px';
    if(gcLabel.textContent!==best.m.label){gcLabel.textContent=best.m.label;gcVal.textContent=best.m.val;gcDesc.textContent=best.m.desc;gcIcon.textContent=best.m.icon;}
  }else geoCard.style.opacity=0;
  renderer.render(scene,camera);
}
animate();
setTimeout(()=>loader.classList.add('hide'),4000);

// ── SCROLL REVEAL (sr, sr-scale, stagger) ──
const obs=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
},{threshold:0.12, rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.sr,.sr-scale,.stagger').forEach(el=>obs.observe(el));

// ── DASHBOARD SCREENSHOT CAROUSEL ──
(function(){
  const shots=[...document.querySelectorAll('.shot')];
  const tabs=[...document.querySelectorAll('.shot-tab')];
  if(!shots.length) return;
  let i=0, timer;
  function show(n){ i=n;
    shots.forEach((s,k)=>s.classList.toggle('active',k===n));
    tabs.forEach((t,k)=>t.classList.toggle('active',k===n));
  }
  function next(){ show((i+1)%shots.length); }
  function start(){ timer=setInterval(next,5000); }
  function stop(){ clearInterval(timer); }
  tabs.forEach(t=>t.addEventListener('click',()=>{ stop(); show(+t.dataset.i); start(); }));
  const wrap=document.querySelector('.browser');
  if(wrap){ wrap.addEventListener('mouseenter',stop); wrap.addEventListener('mouseleave',start); }
  start();
})();