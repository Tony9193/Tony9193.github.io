import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function initPocketScope() {
  const view = document.getElementById("pocket-view");
  const stage = view.parentElement;
  const glass = stage.querySelector(".scope-glass");
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: view, alpha: true, antialias: true });
  } catch (error) {
    console.error("Pocket scope: WebGL unavailable", error);
    view.hidden = true;
    stage.parentElement.querySelector("figcaption").append(" · 2D (WebGL unavailable)");
    return;
  }
  stage.classList.add("modeled");
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  const camera = new T.OrthographicCamera(-4, 4, 2, -2, 0.1, 50);
  camera.position.set(0.65,1.9,8);
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld();
  const material = (color, metalness, roughness) => new T.MeshStandardMaterial({ color, metalness, roughness });
  const alloy = material(0x687777, 0.9, 0.27);
  const graphite = material(0x263336, 0.55, 0.36);
  const rubber = material(0x111719, 0.08, 0.62);
  const silver = material(0xc0caca, 0.94, 0.23);
  const mint = material(0x52e6bb, 0.38, 0.31);
  const amber = material(0xf6b448, 0.4, 0.3);
  function part(geometry, mat, x, y, z) {
    const mesh = new T.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }
  const slab = (x,y,z,w,h,d,r,mat) => part(new RoundedBoxGeometry(w,h,d,4,r),mat,x,y,z);
  const disk = (x,y,z,r,d,mat) => {
    const mesh = part(new T.CylinderGeometry(r,r,d,48),mat,x,y,z);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  };
  slab(0,0,0,5.9,2.95,0.54,0.22,alloy);
  slab(0,0,-0.23,5.83,2.89,0.17,0.08,rubber);
  slab(0,0,0.24,5.81,2.85,0.12,0.055,graphite);
  slab(-0.49,0,0.3,4.58,2.39,0.09,0.04,rubber);

  function legend(text,x,y,width,height,z=0.309) {
    const sheet = document.createElement("canvas");
    sheet.width = 768; sheet.height = 80;
    const ctx = sheet.getContext("2d");
    ctx.fillStyle = "#d5e0dc";
    ctx.font = "600 55px monospace";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 42);
    const map = new T.CanvasTexture(sheet);
    map.colorSpace = T.SRGBColorSpace;
    part(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false}),x,y,z);
  }
  legend("BH4HAP   /   FIELD INSTRUMENTS", -1.5,1.3,2.15,0.15);
  legend("PS-04",2.4,0.98,1.1,0.22);
  legend("ACQUIRE",2.41,-0.22,0.98,0.13);
  disk(2.29,0.34,0.34,0.40,0.09,silver);
  disk(2.29,0.34,0.42,0.344,0.19,rubber);
  for(let i=0;i<36;i++) {
    const a=i*Math.PI/18;
    slab(2.29+0.344*Math.sin(a),0.34+0.344*Math.cos(a),0.425,0.019,0.019,0.14,0.008,graphite);
  }
  disk(2.29,0.34,0.525,0.315,0.035,graphite);
  slab(2.29,0.56,0.55,0.032,0.115,0.014,0.006,mint);
  for(const [i,mat] of [amber,mint,material(0xc283dc,0.3,0.38),material(0x88afee,0.3,0.38)].entries()) {
    const x = -2.05 + i*0.68;
    const ring = part(new T.TorusGeometry(0.13,0.035,12,40),silver,x,1.50,0);
    ring.rotation.x = Math.PI/2;
    part(new T.CylinderGeometry(0.15,0.15,0.09,40),mat,x,1.46,0);
    part(new T.CylinderGeometry(0.098,0.098,0.018,32),rubber,x,1.518,0);
    part(new T.CylinderGeometry(0.027,0.027,0.022,16),silver,x,1.523,0);
  }
  slab(2.29,-0.67,0.34,0.78,0.43,0.09,0.045,rubber);
  for(const x of [-2.7,2.7]) for(const y of [-1.25,1.25]) {
    disk(x,y,-0.32,0.065,0.022,silver);
    slab(x,y,-0.338,0.068,0.015,0.008,0.003,rubber);
  }
  slab(0,0,-0.326,3.8,1.7,0.05,0.025,graphite);
  const key = new T.DirectionalLight(0xfff4db,2.2);
  key.position.set(-3,6,6); scene.add(key);
  new ResizeObserver(() => {
    const w=stage.clientWidth, h=stage.clientHeight;
    if (!w || !h) return;
    const halfWidth=Math.max(3.06,1.62*w/h);
    camera.left=-halfWidth; camera.right=halfWidth;
    camera.top=halfWidth*h/w; camera.bottom=-camera.top;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);
    // The orthographic front face projects affinely; keep native touch controls on that face.
    const point = (x,y,z) => {
      const p=new T.Vector3(x,y,z).project(camera);
      return [(p.x+1)*w/2,(1-p.y)*h/2];
    };
    const [x,y]=point(-2.665,1.055,0.351);
    const [rx,ry]=point(1.685,1.055,0.351);
    const [bx,by]=point(-2.665,-1.055,0.351);
    glass.style.cssText=`left:${x}px;top:${y}px;width:${rx-x}px;height:${by-y}px;transform:matrix(1,${(ry-y)/(rx-x)},${(bx-x)/(by-y)},1,0,0)`;
    for (const [id,cy,z] of [["scope-hold-btn",0.34,0.55],["scope-auto-btn",-0.67,0.39]]) {
      const [kx,ky]=point(2.29,cy,z);
      Object.assign(document.getElementById(id).style,{left:`${kx}px`,top:`${ky}px`});
    }
    renderer.render(scene,camera);
  }).observe(stage);
}
