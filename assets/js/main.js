let scene, camera, renderer, mesh, meshFloor, ambientLight, pointLight,crate,crateTexture,meshTexture,meshBump,meshNormal,clock; 
let keyboard = {};
let player = {height:2.13, speed:0.1, turnSpeed:0.01, canshoot: 0};
let models = {
  tree: {obj: "./assets/objects/treeDecorated.obj", mtl: "./assets/objects/treeDecorated.mtl", mesh: null},
  traintender: {obj: "./assets/objects/trainTender.obj", mtl: "./assets/objects/trainTender.mtl", mesh: null},
  rocketlauncher: {obj: "./assets/objects/rocketlauncherSide.obj", mtl: "./assets/objects/rocketlauncherSide.mtl", mesh: null},
  rocket: {obj: "./assets/objects/ammo_rocket.obj", mtl: "./assets/objects/ammo_rocket.mtl", mesh: null},
  grass: {obj: "./assets/objects/LowPolyGrass.obj", mtl: "./assets/objects/LowPolyGrass.mtl", mesh: null}
};
let meshes = {};
let loadScreen = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 ),
  box: new THREE.Mesh(
    new THREE.BoxGeometry(3,3,3),
    new THREE.MeshBasicMaterial({color: 0x123456})
  )
}
let RESOURCES_LOADED = false;
let LOADING_MANAGER = null;
let bullets = [];

function init(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
  clock = new THREE.Clock();

  loadScreen.box.position.set(0,0,5);
  loadScreen.camera.lookAt(loadScreen.box.position);
  loadScreen.scene.add(loadScreen.box);

  loadingManager = new THREE.LoadingManager();
  loadingManager.onProgress = function(item,loaded,total){
    console.log(item,loaded,total);
  };
  loadingManager.onLoad = function(){
    console.log("All resources loaded");
    RESOURCES_LOADED = true;
    onResourcesLoaded();
  };
  let textureLoader = new THREE.TextureLoader(loadingManager);

  // SkyBox
  let text_up = new textureLoader.load('./assets/images/skybox/arid2_up.jpg');
  let text_bk = new textureLoader.load('./assets/images/skybox/arid2_bk.jpg');
  let text_dn = new textureLoader.load('./assets/images/skybox/arid2_dn.jpg');
  let text_ft = new textureLoader.load('./assets/images/skybox/arid2_ft.jpg');
  let text_lf = new textureLoader.load('./assets/images/skybox/arid2_lf.jpg');
  let text_rt = new textureLoader.load('./assets/images/skybox/arid2_rt.jpg');
  let matArr = [];
  matArr.push(new THREE.MeshBasicMaterial({map:text_ft}));
  matArr.push(new THREE.MeshBasicMaterial({map:text_bk}));
  matArr.push(new THREE.MeshBasicMaterial({map:text_up}));
  matArr.push(new THREE.MeshBasicMaterial({map:text_dn}));
  matArr.push(new THREE.MeshBasicMaterial({map:text_rt}));
  matArr.push(new THREE.MeshBasicMaterial({map:text_lf}));
  for(let i=0;i<6;i++)matArr[i].side = THREE.BackSide;

  let skyboxG = new THREE.BoxGeometry(1000,1000,1000);
  let skybox = new THREE.Mesh(skyboxG, matArr);
  scene.add(skybox);

  // kis doboz
  meshTexture = new textureLoader.load('./assets/images/crate0.png');
  meshBump = new textureLoader.load('./assets/images/crate0_bump.png');
  meshNormal = new textureLoader.load('./assets/images/crate0_normal.png');
  mesh = new THREE.Mesh( 
    new THREE.BoxGeometry(1,1,1), 
    new THREE.MeshPhongMaterial({ 
      color: 0xff4444,
      map:meshTexture,
      bumpMap:meshBump,
      normalMap:meshNormal
    })
  );
  mesh.position.y = 0.5;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add( mesh );
  
  // Padló
  floorTexture = new textureLoader.load('./assets/images/grass.jpg');
  meshFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(500,500,20,20),
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: floorTexture
    })
  );
  meshFloor.rotation.x -= Math.PI / 2;
  meshFloor.receiveShadow = true;
  scene.add( meshFloor );

  // Láda
  crateTexture = new textureLoader.load('./assets/images/crateTexture.png');

  crate = new THREE.Mesh(
    new THREE.BoxGeometry(3,3,3),
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: crateTexture
    })
  );
  scene.add(crate);
  crate.position.set(2,1.5,3);
  crate.receiveShadow = true;
  crate.castShadow = true;

  ambientLight = new THREE.AmbientLight(0xffffff,0.7);
  scene.add(ambientLight);
  ambientLight.position.set(20,-20, 30);

  pointLight = new THREE.PointLight(0xffffff, 0.6, 18);
  pointLight.position.set(-3,6,-3);
  pointLight.castShadow = true;
  pointLight.shadow.camera.near = 0.1;
  pointLight.shadow.camera.far = 25;
  scene.add(pointLight);  

  // Load objects
  for(let _key in models){
    (function(key){
      let mtl = new THREE.MTLLoader(loadingManager);
      mtl.load(models[_key].mtl, function(material){
        material.preload();
        let objL = new THREE.OBJLoader(loadingManager);
        objL.setMaterials(material);
        objL.load(models[_key].obj, function(mesh){
          mesh.traverse(function(node){
            if(node instanceof THREE.Mesh){
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          models[key].mesh = mesh;
        });
      });
    })(_key);
  }

  camera.position.set(0,player.height,-5);
  camera.lookAt(new THREE.Vector3(0,player.height,0));
  
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  document.body.appendChild( renderer.domElement );
  
  animate();
}

function onResourcesLoaded(){
  meshes["trainT"] = models.traintender.mesh.clone();
  meshes["trainT"].position.set(10,0,10);
  meshes["trainT"].scale.set(10,10,10);

  meshes["treeDecor"] = models.tree.mesh.clone();
  meshes["treeDecor"].position.set(0,1,0);

  meshes["rocketL"] = models.rocketlauncher.mesh.clone();
  meshes["rocketL"].scale.set(5,5,5);

  meshes["rocketammo"] = models.rocket.mesh.clone();
  meshes["rocketammo"].scale.set(5,5,5);

  meshes["grass"] = models.grass.mesh.clone();
  meshes["grass"].scale.set(0.5,0.5,0.5);

  scene.add(meshes["trainT"]);
  scene.add(meshes["treeDecor"]);
  scene.add(meshes["rocketL"]);

  
  // Grass
  for(let i=0;i<20;i++){
    let posX = Math.random()*20;
    let posZ = Math.random()*20 + 3;
    let grass = meshes["grass"].clone();
    scene.add(grass);
    grass.position.set(posX,0,posZ);
  }
}

function animate() {
  let time = Date.now() * 0.0005;
  let delta = clock.getDelta();
  for(let i=0;i<bullets.length;i++){
    if(bullets[i]==undefined)continue;
    if(bullets[i].alive == false){
      bullets.splice(i,1);
      continue;
    }
    bullets[i].position.add(bullets[i].velocity);
  }

  if(RESOURCES_LOADED == false){
    requestAnimationFrame(animate);
    renderer.render(loadScreen.scene, loadScreen.camera);
    return;
  }

  requestAnimationFrame( animate );

  let amp = 1/20;
  let freq = 3;
  let sinBob = amp*Math.sin(time*freq*Math.PI*2);
  let cosBob = amp*Math.cos(time*freq*Math.PI*2);
  if(camera.position.y > player.height+0.3 || camera.position.y < 0){
    sinBob = -amp*Math.sin(time*freq*Math.PI*2);
    cosBob = -amp*Math.cos(time*freq*Math.PI*2);
  }

  // Movement: W S A D
  if(keyboard[87]){
    camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
    camera.position.y += sinBob;
    camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
  }
  if(keyboard[83]){
    camera.position.x += Math.sin(camera.rotation.y) * player.speed;
    camera.position.y += cosBob;
    camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
  }
  if(keyboard[65]){
    camera.position.x += Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
  }
  if(keyboard[68]){
    camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
  }
  
  // Movement: Run(Shift)
  if(keyboard[16]){
    player.speed = 0.3;
  }

  // Camera rotate: Arrow keys
  if(keyboard[37]){
    camera.rotation.y -= Math.PI * player.turnSpeed;
  }
  if(keyboard[39]){
    camera.rotation.y += Math.PI * player.turnSpeed;
  }

  // Shoot (space)
  if(keyboard[32] && player.canshoot <= 0){
    let bullet = meshes["rocketammo"].clone();

    bullet.position.set(
      meshes['rocketL'].position.x,
      meshes['rocketL'].position.y,
      meshes['rocketL'].position.z
    );
    bullet.rotation.set(
      meshes['rocketL'].rotation.x,
      meshes['rocketL'].rotation.y,
      meshes['rocketL'].rotation.z
    );

    bullet.velocity = new THREE.Vector3(
      -Math.sin(camera.rotation.y),
      0,
      Math.cos(camera.rotation.y)
    );
    
    bullet.alive = true;
    setTimeout(function(){
      bullet.alive = false;
      scene.remove(bullet);
    },1000);
    bullets.push(bullet);

    scene.add(bullet);
    player.canshoot = 100;
  }

  if(keyboard[75] && player.canshoot <= 0){
    let bullet = meshes["rocketL"].clone();

    bullet.position.set(
      meshes['rocketL'].position.x,
      meshes['rocketL'].position.y,
      meshes['rocketL'].position.z
    );
    bullet.rotation.set(
      meshes['rocketL'].rotation.x,
      meshes['rocketL'].rotation.y,
      meshes['rocketL'].rotation.z
    );
    bullet.scale.set(20,20,20);

    bullet.velocity = new THREE.Vector3(
      -Math.sin(camera.rotation.y),
      0,
      Math.cos(camera.rotation.y)
    );
    
    bullet.alive = true;
    setTimeout(function(){
      bullet.alive = false;
      scene.remove(bullet);
    },1000);
    bullets.push(bullet);

    scene.add(bullet);
    player.canshoot = 5;
  }

  if(player.canshoot > 0) player.canshoot -= 1;

  // Weapon in hand
  meshes["rocketL"].position.set(
    camera.position.x - Math.sin(camera.rotation.y + Math.PI / 4) * 0.5,
    camera.position.y - 0.4 + Math.sin(time * 2)*0.05,
    camera.position.z + Math.cos(camera.rotation.y + Math.PI / 4) * 0.5
  );
  meshes["rocketL"].rotation.set(
    camera.rotation.x,
    camera.rotation.y + Math.PI,
    camera.rotation.z
  );

	renderer.render( scene, camera );
}

function keyDown(event){
  keyboard[event.keyCode] = true;
}
function keyUp(event){
  keyboard[event.keyCode] = false;
}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = init;