import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Coordinates run from the binding posts (-X) toward the operator (+X).
export function createStraightKey(canvas) {
  const renderer = new T.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(220, 112, false);
  const scene = new T.Scene();
  const room = new RoomEnvironment(), env = new T.PMREMGenerator(renderer);
  scene.environment = env.fromScene(room, 0.035).texture;
  room.dispose(); env.dispose();
  const camera = new T.OrthographicCamera(-2.44,2.44,1.24,-1.24,0.1,30);
  camera.position.set(3.2,3.8,7.8);
  camera.lookAt(0,0.48,0);
  const light = new T.DirectionalLight(0xfff0d7,2.3);
  light.position.set(-2,5,4); scene.add(light);
  const metal = (color,metalness,roughness) => new T.MeshStandardMaterial({color,metalness,roughness});
  const brass=metal(0xc39653,.88,.26), nickel=metal(0xc1c7ce,.91,.22);
  const enamel=metal(0x343934,.48,.28), black=metal(0x242323,.15,.23);
  const lever=new T.Group();
  lever.position.set(-.42,.65,0); scene.add(lever);
  function mesh(geo,mat,x,y,z,parent=scene) {
    const obj=new T.Mesh(geo,mat); obj.position.set(x,y,z); parent.add(obj); return obj;
  }
  const box=(w,h,d,r,...args)=>mesh(new RoundedBoxGeometry(w,h,d,3,r),...args);
  const turned=(profile,...args)=>mesh(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),48),...args);
  function screw(x,y,z,r,mat) {
    turned([[0,0],[r,0],[r,.04],[r*.86,.055],[0,.055]],mat,x,y,z);
    box(r*1.35,.007,.018,.003,black,x,y+.055,z);
  }
  box(3.94,.17,1.53,.08,black,0,.09,0);
  box(3.89,.19,1.49,.085,enamel,0,.21,0);
  box(2.81,.065,.93,.032,brass,-.18,.334,0);
  for(const z of [-.54,.54]) {
    screw(1.63,.304,z,.095,nickel);
    turned([[0,0],[.15,0],[.15,.06],[.09,.075],[.09,.22],[.13,.23],[.13,.31],[.10,.33],[0,.33]],brass,-1.63,.3,z);
  }
  for(const z of [-.32,.32]) {
    box(.32,.43,.14,.065,brass,-.42,.54,z);
    const bearing=mesh(new T.CylinderGeometry(.114,.114,.21,32),nickel,-.42,.65,z);
    bearing.rotation.x=Math.PI/2;
  }
  box(2.75,.11,.21,.045,brass,.55,0,0,lever);
  const knob=[[0,0],[.16,0],[.18,.035],[.14,.11],[.16,.19],[.32,.23],[.36,.29],[.35,.35],[.27,.39],[0,.405]];
  turned(knob,black,1.89,.052,0,lever);
  turned([[0,0],[.12,0],[.12,.06],[.07,.08],[.07,.24],[0,.24]],nickel,1.2,.36,0);
  turned([[0,0],[.07,0],[.07,.18],[0,.18]],nickel,1.62,-.22,0,lever);
  // Return spring and the knurled tension nut sit behind the trunnion.
  const helix=Array.from({length:121},(_,i)=>new T.Vector3(-.93+.09*Math.cos(i*Math.PI/12),.37+i*.0022,.09*Math.sin(i*Math.PI/12)));
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(helix),120,.017,7,false),nickel,0,0,0);
  turned([[0,0],[.055,0],[.055,.15],[.14,.16],[.14,.24],[.12,.26],[0,.26]],brass,-.51,.05,0,lever);
  for(let i=0;i<24;i++) {
    const a=2*Math.PI*i/24;
    mesh(new T.CylinderGeometry(.011,.011,.078,5),brass,-.51+.14*Math.cos(a),.25,.14*Math.sin(a),lever);
  }
  return down => {
    lever.rotation.z=down ? -.022 : .048;
    renderer.render(scene,camera);
  };
}
