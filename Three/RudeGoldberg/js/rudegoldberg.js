/*
	Rude Goldberg

	Kode basert på "tiltableTerrain.js" av Werner Farstad. Endret koden slik at terrenget nå er et labyrintspill.
 */
import * as THREE from "../../lib/three/build/three.module.js";
import { TrackballControls } from '../../lib/three/examples/jsm/controls/TrackballControls.js';
import { addCoordSystem} from "../../lib/wfa-coord.js";
import {getHeightData} from "../../lib/wfa-utils.js";
import {TWEEN} from '../../lib/three/examples/jsm/libs/tween.module.min.js';
import {GLTFLoader} from "../../lib/three/examples/jsm/loaders/GLTFLoader.js";
import {SkeletonUtils} from "../../lib/three/examples/jsm/utils/SkeletonUtils.js";

//Globale variabler
let scene, camera, renderer, listener;
let clock = new THREE.Clock();
let controls;
let currentlyPressedKeys = [];
let soundFX = [];

let ballInPlay = false;

let skyBox;
let SKYBOX_SIZE = 5000;

let TERRAIN_SIZE = 20;
let terrainMesh;
let isTerrainHeightLoaded = false;
let ammoHeightData = null;
let terrainMaxHeight = undefined;   // Dennes settes basert på innleste høydedata (se createTerrainAmmoShape).
let terrainMinHeight = undefined;   // Dennes settes basert på innleste høydedata (se createTerrainAmmoShape).
let terrainWidthExtents = TERRAIN_SIZE*2;
let terrainDepthExtents = TERRAIN_SIZE*2;
let terrainWidth = 256;     // NB! Denne må matche størrelse på innlest høydedatafil.
let terrainDepth = 256;     // NB! Denne må matche størrelse på innlest høydedatafil (er i dette eksemplet 128x128 piksler).
let groundShape;

let ballInElevator = false;
let elevatorMesh;
let elevatorUpTween, elevatorOpenTween;

let buttonPressed = false;

export function start(){
    document.addEventListener('keyup', handleKeyUp, false);
    document.addEventListener('keydown', handleKeyDown, false);
    setupPhysicsWorld();
    setupGraphics();
    createTrack(scene);
    animate();
}

function setupGraphics(){

    //create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    //create camera
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 20000 );
    camera.position.set( 15, 30, 50 );
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //Add directional light
    let dirLight1 = new THREE.DirectionalLight( 0xffffff , 1);
    dirLight1.color.setHSL( 0.1, 1, 0.95 );
    dirLight1.position.set( -0.1, 1.75, 0.1 );
    dirLight1.position.multiplyScalar( 100 );

    dirLight1.castShadow = true;
    let dLight = 500;
    let sLight = dLight;
    dirLight1.shadow.camera.left = - sLight;
    dirLight1.shadow.camera.right = sLight;
    dirLight1.shadow.camera.top = sLight;
    dirLight1.shadow.camera.bottom = - sLight;
    dirLight1.shadow.camera.near = dLight / 30;
    dirLight1.shadow.camera.far = dLight;
    dirLight1.shadow.mapSize.x = 1024 * 2;
    dirLight1.shadow.mapSize.y = 1024 * 2;
    scene.add( dirLight1 );

    let dirLight2= new THREE.DirectionalLight( 0xffffff , 1);
    dirLight2.position.set( 0.1, 0.1, 10 );
    dirLight2.castShadow = true;
    scene.add( dirLight2 );

    //Setup the renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0xbfd1e5 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;

    // Lyd
    listener = new THREE.AudioListener();
    camera.add(listener);
    const music = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    // Lydkile:
    // Stardust by Kjartan Abel
    // Contact info at: https://kjartan-abel.com
    // Free download: https://freesound.org/people/kjartan_abel/sounds/546087/
    // This work is licensed under CC BY-SA 4.0
    audioLoader.load("assets/stardust-kjartan-abel.wav", function(buffer) {
        music.setBuffer(buffer);
        music.setLoop(true);
        music.setVolume(0.2);
        music.play();
    });

    // Lydkilde: https://freesound.org/people/Za-Games/sounds/539854/
    const soundEffect = new THREE.Audio(listener);
    audioLoader.load("assets/ball-clack.wav", function(buffer) {
        soundEffect.setBuffer(buffer);
        soundEffect.setLoop(false);
        soundEffect.setVolume(0.2);
    });

    // Lydkilde: https://freesound.org/people/tim.kahn/sounds/91926/
    const elevatorDing = new THREE.Audio(listener);
    audioLoader.load("assets/ding.wav", function(buffer) {
        elevatorDing.setBuffer(buffer);
        elevatorDing.setLoop(false);
        elevatorDing.setVolume(0.2);
    });

    soundFX.push(soundEffect);
    soundFX.push(elevatorDing);

    //Koordinatsystem:
    addCoordSystem(scene);

    // Skybox
    addSkybox();

    // Partikler
    createParticles(scene, 2, true, 0.5, true, 0xFFFFFF)

    addControls();

    window.addEventListener('resize', onWindowResize, false);
}

function keyCheck(elapsed) {
    if (currentlyPressedKeys[72] && !ballInPlay) {	//H
        createBall(scene, {x: 0, y: 5, z: 0}, 0xff0505, 10);
        ballInPlay = true;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
    animate();
}

/* Org. kode av Werner Farstad. Hentet fra "Skybox1.js". Endret teksturkilde. */
function addSkybox() {
    let imagePrefix = "textures/blizzard_";
    let directions = ["ft", "bk", "up", "dn", "rt", "lf"];
    let imageSuffix = ".jpg";

    let materialArray = [];
    for (let i = 0; i < 6; i++)
        materialArray.push(new THREE.MeshBasicMaterial({
            map:  new THREE.TextureLoader().load(imagePrefix + directions[i] + imageSuffix),
            side: THREE.BackSide
        }));
    // let skyMaterial = new THREE.MeshFaceMaterial(materialArray);
    for (let i = 0; i < 6; i++)
        materialArray[i].side = THREE.BackSide;

    let skyboxGeo = new THREE.BoxGeometry( SKYBOX_SIZE, SKYBOX_SIZE, SKYBOX_SIZE);
    skyBox = new THREE.Mesh( skyboxGeo, materialArray );
    scene.add( skyBox );
}

function updateParticles() {
    scene.children.forEach((childMesh) => {
        if (childMesh instanceof THREE.Points) {
            if (childMesh.name === 'animatedParticles') {
                let vertices = childMesh.geometry.vertices;
                let v;
                for (let i = 0; i < vertices.length; i++) {
                    v = vertices[i];
                    if (v != null) {
                        v.y = v.y - (v.velocityY);
                        v.x = v.x - (v.velocityX);

                        if (v.y <= -1000) v.y = 1000;
                        if (v.x <= -1000 || v.x >= 1000) v.velocityX = v.velocityX * -1;
                    }
                    childMesh.geometry.verticesNeedUpdate = true;
                }
            }
        }
    });
}

export function animate(){
    requestAnimationFrame( animate );
    let deltaTime = clock.getDelta();
    updatePhysics( deltaTime, soundFX );

    updateParticles();

    TWEEN.update();

    //Sjekker input:
    keyCheck(deltaTime);
    //Tegner scenen med gitt kamera:
    render();
    //Oppdater trackball-kontrollen:
    if (controls)
        controls.update();
}

function render()
{
    renderer.render(scene, camera);
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
    //console.log(event);
    currentlyPressedKeys[event.keyCode] = true;
}

//Legger til roter/zoom av scenen:
function addControls() {
    controls = new TrackballControls(camera);
    controls.addEventListener( 'change', render);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 10;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
}


// Org.kode av Werner Farstad. Hentet fra "ammoTerrainDemo1.js".

// Legger til terreng:
function addTerrain(pos) {
    getHeightData('assets/terrain_map_rg.png', 256, 256, terrainHeightLoaded, pos);
}

//Denne kjores naar hoydedata er ferdiga lastet og generert:
function terrainHeightLoaded(heightData, pos) {
    let textureLoader = new THREE.TextureLoader();
    textureLoader.load( "./textures/stone.jpg", function( texture ) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( (terrainWidth - 1) / 32, (terrainDepth - 1) / 32);

        /*
        *
        let quat = new THREE.Quaternion();
        quat.setFromAxisAngle(axis, rotation.angle);

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
        * */

        // Ammo: Lager og returnerer en btHeightfieldTerrainShape:
        groundShape = createTerrainAmmoShape(heightData, terrainWidth, terrainDepth);
        let groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

        // Roterer planet
        let quat = new THREE.Quaternion();
        quat.setFromAxisAngle(new THREE.Vector3( 1/8, -1, 1/8 ), Math.PI/2)
        groundTransform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) )

        let groundMass = 0;
        let groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
        groundShape.calculateLocalInertia( groundMass, groundLocalInertia );
        let groundMotionState = new Ammo.btDefaultMotionState( groundTransform );

        let rbInfo = new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia );
        let groundBody = new Ammo.btRigidBody(rbInfo);
        groundBody.setRestitution(0.5); //Sprett!
        groundBody.setFriction(0.3);
        physicsWorld.addRigidBody( groundBody, colGroupBox,  colGroupBox | colGroupBall);

        // Three:
        // scaleX / scaleY henger sammen med heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, 1, scaleZ ) );
        // i createTerrainAmmoShape()
        let scaleX = terrainWidthExtents / ( terrainWidth - 1 );    //2 * 400 / (128-1) = 6
        let scaleZ = terrainDepthExtents / ( terrainDepth - 1 );    //2 * 400 / (128-1) = 6
        // Størrelse på PlaneBufferGeometry: with = height = 128 * 6 = 768
        // Denne inndeles så i 127 * 127 småruter.
        let terrainGeometry = new THREE.PlaneBufferGeometry( terrainWidth*scaleX, terrainDepth*scaleZ, terrainWidth - 1, terrainDepth - 1);
        terrainGeometry.rotateX( - Math.PI / 2 );
        let vertices = terrainGeometry.attributes.position.array;
        // Ammo-shapen blir (automatisk) sentrert om origo basert på terrainMinHeight og terrainMaxHeight.
        // Må derfor korrigere THREE-planets y-verdier i forhold til dette.
        // Flytter dermed three-planet NED, tilsvarende minHeigt + (maxHeight - minHeight)/2.
        let delta = (terrainMinHeight + ((terrainMaxHeight-terrainMinHeight)/2));
        for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
            // j + 1 because it is the y component that we modify
            vertices[ j + 1 ] = heightData[ i ] - delta;
        }
        // Oppdater normaler:
        terrainGeometry.computeVertexNormals();

        let groundMaterial = new THREE.MeshPhongMaterial( { color: 0xC7C7C7, side: THREE.DoubleSide } );
        groundMaterial.map = texture;
        groundMaterial.needsUpdate = true;

        terrainMesh = new THREE.Mesh( terrainGeometry, groundMaterial );
        terrainMesh.userData.physicsBody = groundBody;
        rigidBodies.push(terrainMesh);

        terrainMesh.receiveShadow = true;
        scene.add( terrainMesh );

        isTerrainHeightLoaded = true;

        animate();
    } );
}

// FRA: http://kripken.github.io/ammo.js/examples/webgl_demo_terrain/index.html
// Lager en Ammo.btHeightfieldTerrainShape vha. minnebufret ammoHeightData.
// ammoHeightData FYLLES vha. heightData OG terrainWidth, terrainDepth - parametrene.
// Gjøres vha. brukes Ammo._malloc og Ammo.HEAPF32[].
function createTerrainAmmoShape(heightData, terrainWidth, terrainDepth) {

    // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
    let heightScale = 1;

    // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
    let upAxis = 1;

    // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
    let hdt = "PHY_FLOAT";

    // Set this to your needs (inverts the triangles)
    let flipQuadEdges = false;

    // Creates height data buffer in Ammo heap
    ammoHeightData = Ammo._malloc( 4 * terrainWidth * terrainDepth );

    // NB! Viktig å finne og sette terrainMaxHeight og terrainMinHeight:
    let p = 0;
    let p2 = 0;
    terrainMaxHeight = -100000;     //NB! setter til en lav (nok) verdi for å være sikker.
    terrainMinHeight = 100000;      //NB! setter til en høy (nok) verdi for å være sikker.
    // Copy the javascript height data array to the Ammo one.
    for ( let j = 0; j < terrainDepth; j ++ ) {
        for ( let i = 0; i < terrainWidth; i ++ ) {
            if (heightData[p] < terrainMinHeight)
                terrainMinHeight = heightData[p];
            if (heightData[p] >= terrainMaxHeight)
                terrainMaxHeight = heightData[p];
            // write 32-bit float data to memory  (Se: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift)
            Ammo.HEAPF32[ammoHeightData + p2 >> 2] = heightData[ p ];   // >>  Signed right shift. Shifts right by pushing copies of the leftmost bit in from the left, and let the rightmost bits fall off.
            p ++;
            // 4 bytes/float
            p2 += 4;
        }
    }
    // Creates the heightfield physics shape
    let heightFieldShape = new Ammo.btHeightfieldTerrainShape(
        terrainWidth,
        terrainDepth,
        ammoHeightData,
        heightScale,
        terrainMinHeight,
        terrainMaxHeight,
        upAxis,
        hdt,
        flipQuadEdges
    );

    // Set horizontal scale
    let scaleX = terrainWidthExtents / ( terrainWidth - 1 );
    let scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
    heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, 1, scaleZ ) );
    heightFieldShape.setMargin( 0.0 );
    return heightFieldShape;
}

/*
	Rude Goldberg hjelpefunksjoner

    Kode basert på diverse kode gitt ut av Werner Farstad.
 */

let physicsWorld;
let tmpTrans;
let colGroupBox = 1, colGroupBall = 2, colGroupHingeSphere = 4, colGroupHingePlatform = 8, colGroupTriangle = 16;
let rigidBodies = [];
let test = true;

const DEBUG = false;

function setupPhysicsWorld(){
    tmpTrans = new Ammo.btTransform();
    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher          = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache= new Ammo.btDbvtBroadphase(),
        solver              = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
}

function updatePhysics( deltaTime, soundFX ){
    if (!tmpTrans)
        return;
    // Step physics world:
    physicsWorld.stepSimulation( deltaTime, 10 );
    // Update rigid bodies
    for ( let i = 0; i < rigidBodies.length; i++ ) {
        let objThree = rigidBodies[ i ];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if ( ms ) {
            ms.getWorldTransform( tmpTrans );
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
        }
    }

    checkCollisions(soundFX);
}

// Basert på kode fra https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-ammo-js-and-three-js-31a5569291ef
function checkCollisions(soundFX) {
    let dispatcher = physicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();

    for (let i = 0; i < numManifolds; i++) {

        let contactManifold = dispatcher.getManifoldByIndexInternal(i);

        let rb0 = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody);
        let rb1 = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody);
        let threeObject0 = rb0.threeObject;
        let threeObject1 = rb1.threeObject;
        if (!threeObject0 && !threeObject1) continue;
        let userData0 = threeObject0 ? threeObject0.userData : null;
        let userData1 = threeObject1 ? threeObject1.userData : null;
        let tag0 = userData0 ? userData0.tag : "none";
        let tag1 = userData1 ? userData1.tag : "none";

        let numContacts = contactManifold.getNumContacts();

        for (let j = 0; j < numContacts; j++) {

            let contactPoint = contactManifold.getContactPoint(j);
            let distance = contactPoint.getDistance();

            if (distance > 0.0) continue;

            let velocity0 = rb0.getLinearVelocity();
            let velocity1 = rb1.getLinearVelocity();
            let worldPos0 = contactPoint.get_m_positionWorldOnA();
            let worldPos1 = contactPoint.get_m_positionWorldOnB();
            let localPos0 = contactPoint.get_m_localPointA();
            let localPos1 = contactPoint.get_m_localPointB();

            if (tag1 === 'ballMesh' && tag0 === 'domino1' && velocity1.x() > 1.75) {
                soundFX[0].play();

            }

            if (tag1 === 'ballMesh' && tag0 === 'elevator') {
                if (!ballInElevator) {
                    console.log("BALL HIT ELEVATOR");
                    elevatorUpTween.start();
                    ballInElevator = true;
                }
            }

            if (tag1 === 'ballMesh' && tag0 === 'button') {
                if (!buttonPressed) {
                    console.log("BALL HIT BUTTON")
                    for (let i = 0; i < rigidBodies.length; i++) {
                        if (rigidBodies[i].userData.tag === "tree") {
                            console.log("TREE FOUND")
                            console.log(rigidBodies[i])
                            rigidBodies[i].children[2].material.color.setRGB(1,1,0);
                            buttonPressed = true;
                        }
                    }
                }
            }
        }
    }
}

function createTrack(scene) {
    // Platformer
    createBox(scene, "textures/wood.jpg", {x:0,y:0,z:0}, {axis:"z", angle: Math.PI/4}, 0, {width:0.2, height:5, depth:1}, "platform1");
    createBox(scene, "textures/wood.jpg", {x:5,y:-3,z:0}, {axis:"z", angle: Math.PI/2}, 0, {width:0.2, height:6, depth:1}, "platform2");

    // Dominobrikker
    createBox(scene, "textures/marble.jpg", {x:3,y:-1.8,z:0}, {axis:"z", angle: 0}, 20, {width:0.4, height:2, depth:1}, "domino1");
    createBox(scene, "textures/marble.jpg", {x:4.5,y:-1.8,z:0}, {axis:"z", angle: 0}, 20, {width:0.4, height:2, depth:1}, "domino2");
    createBox(scene, "textures/marble.jpg", {x:6,y:-1.8,z:0}, {axis:"z", angle: 0}, 20, {width:0.4, height:2, depth:1}, "domino3");
    createBox(scene, "textures/marble.jpg", {x:7.5,y:-1.8,z:0}, {axis:"z", angle: 0}, 20, {width:0.4, height:2, depth:1}, "domino4");

    // Hinge
    createHingeObject(scene, "textures/wood.jpg", {x:13, y:-9, z:0}, {axis:"z", angle: 0}, 30, {x: 10, y: 2, z: 1}, "hinge");

    // Ball
    createBall(scene, {x:13, y:-5, z:0}, 0xff0505, 10);

    // Rør/trakt
    createPipe(scene, "textures/metal.jpg", {x:-3, y:-30, z:0}, {length: 20, radius:4}, "pipe");

    // Terreng
    addTerrain({x:-37, y:-75, z:1});

    // Heis
    createElevator(scene, "textures/metal.jpg", {x:-30,y:-47,z:0}, {axis:"z", angle: 0}, 0, {width:5, height:1, depth:5}, "elevator");

    // Modell
    loadGLTF({x:-81,y:-60,z:0});

    createChristmasTree(scene, "textures/christmas.png", {x:-100, y:-30, z:0}, {length: 20, radius:4}, "tree");

    createButton(scene, null, {x:-35, y:-50, z:0}, {width:10, height:1, depth:10}, "button");
}

// Basert på "createCompundTVShape" i "ammoShapeHelpers2.js" av Werner Farstad.
function createButton(scene, texturePath, pos, scale, name) {
    // AMMO:
    let cylShape = new Ammo.btCylinderShape( new Ammo.btVector3(scale.width*0.4, scale.height/2, scale.depth*0.4) );
    let footShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.width/2, scale.height/2, scale.depth/2) );
    let compoundShape = new Ammo.btCompoundShape();

    let trans1 = new Ammo.btTransform();
    trans1.setIdentity();
    trans1.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    compoundShape.addChildShape(trans1, cylShape);

    let trans2 = new Ammo.btTransform();
    trans2.setIdentity();
    trans2.setOrigin(new Ammo.btVector3(pos.x, pos.y - scale.height/2, pos.z));
    compoundShape.addChildShape(trans2, footShape);

    let trans4 = new Ammo.btTransform();
    trans4.setIdentity();
    trans4.setOrigin(new Ammo.btVector3(pos.x, pos.y + scale.height, pos.z));      //NB!!
    let motionState = new Ammo.btDefaultMotionState( trans4 );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    compoundShape.calculateLocalInertia( 0, localInertia );
    let rbCompound = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(0, motionState, compoundShape, localInertia));
    // rbCompound.setActivationState(4);
    rbCompound.setRestitution(0.2);
    rbCompound.setFriction(0.9);

    physicsWorld.addRigidBody(rbCompound, colGroupBox, colGroupBall );

    // THREE:
    let compoundMesh = new THREE.Group();

    // cylinder:
    let cylinderMesh = new THREE.Mesh(new THREE.CylinderBufferGeometry(scale.width * 0.4, scale.width * 0.4, scale.height/2, 32), new THREE.MeshPhongMaterial({color: 0xC00000}));
    let originCylinder = trans1.getOrigin();
    let orientationCylinder = trans1.getRotation();
    cylinderMesh.position.set(originCylinder.x(), originCylinder.y(), originCylinder.z());
    cylinderMesh.setRotationFromQuaternion(new THREE.Quaternion(orientationCylinder.x(), orientationCylinder.y(), orientationCylinder.z(), orientationCylinder.w()));
    cylinderMesh.castShadow = true;
    compoundMesh.add(cylinderMesh);

    // foot:
    let footGeometry = new THREE.BoxBufferGeometry(scale.width, scale.height, scale.depth);
    let footMesh = new THREE.Mesh(footGeometry, new THREE.MeshPhongMaterial({color: 0x696969}));
    let originFoot = trans2.getOrigin();
    let orientationRight = trans2.getRotation();
    footMesh.position.set(originFoot.x(), originFoot.y(), originFoot.z());
    footMesh.setRotationFromQuaternion(new THREE.Quaternion(orientationRight.x(), orientationRight.y(), orientationRight.z(), orientationRight.w()));
    footMesh.castShadow = true;
    compoundMesh.add(footMesh);
    compoundMesh.userData.physicsBody = rbCompound;
    compoundMesh.userData.tag = name;

    rigidBodies.push(compoundMesh);
    scene.add(compoundMesh);

    rbCompound.threeObject = compoundMesh;
}

function createChristmasTree(scene, texturePath, pos, scale, name) {
    //Ammo-konteiner:
    let compoundShape = new Ammo.btCompoundShape();
    //Three-konteiner:
    let groupMesh = new THREE.Group();
    groupMesh.position.x = pos.x;
    groupMesh.position.y = pos.y;
    groupMesh.position.z = pos.z;
    groupMesh.scale.set(0.5,0.5,0.5);
    //NB! MeshPhongMaterial

    let texture = new THREE.TextureLoader().load(texturePath);
    let material = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide});

    // Tre:
    let geometry = new THREE.CylinderBufferGeometry(0,scale.radius*3, scale.length*3, 32, 32, false);    // NB! Bruker BufferGeometry
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0,0, 0);
    mesh.scale.set(1,1,1);

    //bottomMesh.scale.set(2.5,2.5,2.5);
    groupMesh.add( mesh );
    createTriangleShapeAddToCompound(compoundShape, mesh);

    // Fot:
    let geometry2 = new THREE.CylinderBufferGeometry(scale.radius,scale.radius, scale.length, 32, 32, false);    // NB! Bruker BufferGeometry
    let mesh2 = new THREE.Mesh(geometry2, new THREE.MeshPhongMaterial({color: 0xD2691E}));
    mesh2.position.set(0,0 - scale.length*2, 0);
    mesh2.scale.set(1,1,1);

    groupMesh.add( mesh2 );
    createTriangleShapeAddToCompound(compoundShape, mesh2);

    // Lys:
    let geometry3 = new THREE.SphereBufferGeometry(scale.radius/2,24, 24, 0, Math.PI*2);    // NB! Bruker BufferGeometry
    let mesh3 = new THREE.Mesh(geometry3, new THREE.MeshPhongMaterial({color: 0x808080}));
    mesh3.position.set(0,scale.length * 1.5, 0);
    mesh3.scale.set(1,1,1);

    groupMesh.add( mesh3 );
    createTriangleShapeAddToCompound(compoundShape, mesh3);

    // Sett samme transformasjon på compoundShape som på bottomMesh:
    let mass = 0;
    groupMesh.userData.tag = name;
    setCompoundTransformationBasedOnMesh(scene, compoundShape, groupMesh, mass);
}

function createElevator(scene, texturePath, pos, rotation, mass, scale, name) {

    let floor = new Ammo.btBoxShape( new Ammo.btVector3( scale.width /2, scale.height/2, scale.depth/2) );
    let sideWall1 = new Ammo.btBoxShape( new Ammo.btVector3( scale.width/2, scale.height/2, scale.depth/2) );
    let sideWall2 = new Ammo.btBoxShape( new Ammo.btVector3( scale.width/2, scale.height/2, scale.depth/2) );
    let frontWall = new Ammo.btBoxShape( new Ammo.btVector3( scale.width/2, scale.height/2, scale.depth/2) );
    let backWall = new Ammo.btBoxShape( new Ammo.btVector3( scale.width/2, scale.height/2, scale.depth/2) );

    let compoundShape = new Ammo.btCompoundShape();

    let trans1 = new Ammo.btTransform();
    trans1.setIdentity();
    trans1.setOrigin(new Ammo.btVector3(pos.x, pos.y + scale.width/4, pos.z));
    let quat1 = new THREE.Quaternion();
    quat1.setFromAxisAngle(new THREE.Vector3( 0, 0, 1 ), Math.PI/16);
    trans1.setRotation( new Ammo.btQuaternion( quat1.x, quat1.y, quat1.z, quat1.w ) );
    compoundShape.addChildShape(trans1, floor);

    let trans2 = new Ammo.btTransform();
    trans2.setIdentity();
    trans2.setOrigin(new Ammo.btVector3(pos.x + scale.width / 2, pos.y + scale.width/2, pos.z));
    let quat2 = new THREE.Quaternion();
    quat2.setFromAxisAngle(new THREE.Vector3( 0, 0, 1 ), Math.PI/2);
    trans2.setRotation( new Ammo.btQuaternion( quat2.x, quat2.y, quat2.z, quat2.w ) );
    compoundShape.addChildShape(trans2, sideWall1);

    let trans3 = new Ammo.btTransform();
    trans3.setIdentity();
    trans3.setOrigin(new Ammo.btVector3(2* pos.x - scale.width / 2 , 2*pos.y + scale.width/2, pos.z));
    let quat3 = new THREE.Quaternion();
    quat3.setFromAxisAngle(new THREE.Vector3( 0, 0, 1 ), Math.PI/2);
    trans3.setRotation( new Ammo.btQuaternion( quat3.x, quat3.y, quat3.z, quat3.w ) );
    //compoundShape.addChildShape(trans3, sideWall2);
    let motionStateWall2 = new Ammo.btDefaultMotionState( trans3 );
    let localInertiaWall = new Ammo.btVector3( 0, 0, 0 );
    sideWall2.calculateLocalInertia( mass, localInertiaWall );
    let rbWall2 = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(mass, motionStateWall2, sideWall2, localInertiaWall));
    // rbCompound.setActivationState(4);
    rbWall2.setCollisionFlags(rbWall2.getCollisionFlags() | 2);   // BODYFLAG_KINEMATIC_OBJECT = 2 betyr kinematic object, masse=0 men kan flyttes!!
    rbWall2.setActivationState(4);                                         // Never sleep, BODYSTATE_DISABLE_DEACTIVATION = 4

    rbWall2.setRestitution(0.8);
    rbWall2.setFriction(0.9);

    physicsWorld.addRigidBody(rbWall2, colGroupBox, colGroupBall);

    let trans4 = new Ammo.btTransform();
    trans4.setIdentity();
    trans4.setOrigin(new Ammo.btVector3(pos.x, pos.y + scale.width/2, pos.z - scale.depth / 2));
    let quat4 = new THREE.Quaternion();
    quat4.setFromAxisAngle(new THREE.Vector3( 1, 0, 0 ), Math.PI/2);
    trans4.setRotation( new Ammo.btQuaternion( quat4.x, quat4.y, quat4.z, quat4.w ) );
    compoundShape.addChildShape(trans4, frontWall);

    let trans5 = new Ammo.btTransform();
    trans5.setIdentity();
    trans5.setOrigin(new Ammo.btVector3(pos.x, pos.y + scale.width/2, pos.z + scale.depth / 2));
    let quat5 = new THREE.Quaternion();
    quat5.setFromAxisAngle(new THREE.Vector3( 1, 0, 0 ), Math.PI/2);
    trans5.setRotation( new Ammo.btQuaternion( quat5.x, quat5.y, quat5.z, quat5.w ) );
    compoundShape.addChildShape(trans5, backWall);

    let trans6 = new Ammo.btTransform();
    trans6.setIdentity();
    trans6.setOrigin((new Ammo.btVector3(pos.x, pos.y, pos.z)))

    let motionState = new Ammo.btDefaultMotionState( trans6 );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    compoundShape.calculateLocalInertia( mass, localInertia );
    let rbCompound = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(mass, motionState, compoundShape, localInertia));
    // rbCompound.setActivationState(4);
    rbCompound.setCollisionFlags(rbCompound.getCollisionFlags() | 2);   // BODYFLAG_KINEMATIC_OBJECT = 2 betyr kinematic object, masse=0 men kan flyttes!!
    rbCompound.setActivationState(4);                                         // Never sleep, BODYSTATE_DISABLE_DEACTIVATION = 4

    rbCompound.setRestitution(0.8);
    rbCompound.setFriction(0.9);

    physicsWorld.addRigidBody(rbCompound, colGroupBox, colGroupBall);

    // THREE:
    elevatorMesh = new THREE.Group();

    let texture = new THREE.TextureLoader().load(texturePath);

    // Floor:
    let geometryFloor = new THREE.BoxBufferGeometry(scale.width, scale.height, scale.depth);
    let meshFloor = new THREE.Mesh(geometryFloor, new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide}));
    let originFloor = trans1.getOrigin();
    let orientationFloor = trans1.getRotation();
    meshFloor.position.set(originFloor.x(), originFloor.y(), originFloor.z());
    meshFloor.setRotationFromQuaternion(new THREE.Quaternion(orientationFloor.x(), orientationFloor.y(), orientationFloor.z(), orientationFloor.w()));
    meshFloor.castShadow = true;
    elevatorMesh.add(meshFloor);

    // Walls:
    let geometrySideWall1 = new THREE.BoxBufferGeometry(scale.width, scale.height, scale.depth);
    let meshSideWall1 = new THREE.Mesh(geometrySideWall1, new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide}));
    let originSideWall1 = trans2.getOrigin();
    let orientationSideWall1 = trans2.getRotation();
    meshSideWall1.position.set(originSideWall1.x(), originSideWall1.y(), originSideWall1.z());
    meshSideWall1.setRotationFromQuaternion(new THREE.Quaternion(orientationSideWall1.x(), orientationSideWall1.y(), orientationSideWall1.z(), orientationSideWall1.w()));
    meshSideWall1.castShadow = true;
    elevatorMesh.add(meshSideWall1);

    let geometrySideWall2 = new THREE.BoxBufferGeometry(scale.width, scale.height, scale.depth);
    let meshSideWall2 = new THREE.Mesh(geometrySideWall2, new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide}));
    let originSideWall2 = trans3.getOrigin();
    let orientationSideWall2 = trans3.getRotation();
    meshSideWall2.position.set(originSideWall2.x(), originSideWall2.y(), originSideWall2.z());
    meshSideWall2.setRotationFromQuaternion(new THREE.Quaternion(orientationSideWall2.x(), orientationSideWall2.y(), orientationSideWall2.z(), orientationSideWall2.w()));
    meshSideWall2.castShadow = true;
    //elevatorMesh.add(meshSideWall2);

    let geometryFrontWall = new THREE.BoxBufferGeometry(scale.width, scale.height, scale.depth);
    let meshFrontWall = new THREE.Mesh(geometryFrontWall, new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide}));
    let originFrontWall = trans4.getOrigin();
    let orientationFrontWall = trans4.getRotation();
    meshFrontWall.position.set(originFrontWall.x(), originFrontWall.y(), originFrontWall.z());
    meshFrontWall.setRotationFromQuaternion(new THREE.Quaternion(orientationFrontWall.x(), orientationFrontWall.y(), orientationFrontWall.z(), orientationFrontWall.w()));
    meshFrontWall.castShadow = true;
    elevatorMesh.add(meshFrontWall);

    let geometryBackWall = new THREE.BoxBufferGeometry(scale.width, scale.height, scale.depth);
    let meshBackWall = new THREE.Mesh(geometryBackWall, new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide}));
    let originBackWall = trans5.getOrigin();
    let orientationBackWall = trans5.getRotation();
    meshBackWall.position.set(originBackWall.x(), originBackWall.y(), originBackWall.z());
    meshBackWall.setRotationFromQuaternion(new THREE.Quaternion(orientationBackWall.x(), orientationBackWall.y(), orientationBackWall.z(), orientationBackWall.w()));
    meshBackWall.castShadow = true;
    elevatorMesh.add(meshBackWall);

    // Heis
    elevatorMesh.userData.physicsBody = rbCompound;
    elevatorMesh.userData.tag = name;

    rigidBodies.push(elevatorMesh);
    scene.add(elevatorMesh);

    rbCompound.threeObject = elevatorMesh;

    // Dør
    meshSideWall2.userData.physicsBody = rbWall2;
    meshSideWall2.userData.tag = "elevatorDoor";

    rigidBodies.push(meshSideWall2);
    scene.add(meshSideWall2);

    rbWall2.threeObject = meshSideWall2;

    console.log(rbCompound);

    // Animasjon
    elevatorUpTween = new TWEEN.Tween({y:0})
        .to({y:0.15}, 10000)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(moveElevator)


    elevatorOpenTween = new TWEEN.Tween({y:0})
        .to({y:0.05}, 2000)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(openElevator)
        .onStart(function () {
            soundFX[1].play();
        })

    elevatorUpTween.chain(elevatorOpenTween)
}

function moveElevator(object) {
    let elevator = rigidBodies[10];
    let elevatorRB = elevator.userData.physicsBody;
    moveStaticKinematicObject({x: 0, y: object.y, z: 0}, elevatorRB);
    let elevatorDoor = rigidBodies[11];
    let elevatorDoorRB = elevatorDoor.userData.physicsBody;
    moveStaticKinematicObject({x: 0, y: object.y, z: 0}, elevatorDoorRB);
}

function openElevator(object) {
    let elevatorDoor = rigidBodies[11];
    let elevatorDoorRB = elevatorDoor.userData.physicsBody;
    moveStaticKinematicObject({x: 0, y: object.y, z: 0}, elevatorDoorRB);
}

function createPipe(scene, texturePath, pos, scale, name) {

    //Ammo-konteiner:
    let compoundShape = new Ammo.btCompoundShape();
    //Three-konteiner:
    let groupMesh = new THREE.Group();
    groupMesh.position.x = pos.x;
    groupMesh.position.y = pos.y;
    groupMesh.position.z = pos.z;
    groupMesh.rotation.z = -Math.PI / 8;
    groupMesh.scale.set(0.5,0.5,0.5);
    //NB! MeshPhongMaterial

    let texture = new THREE.TextureLoader().load(texturePath);
    let material = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide});

    // Toppen av trakten:
    let geometry = new THREE.CylinderBufferGeometry(scale.radius*3,scale.radius, scale.length, 32, 32, true);    // NB! Bruker BufferGeometry
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0,0, 0);
    mesh.scale.set(1,1,1);

    //bottomMesh.scale.set(2.5,2.5,2.5);
    groupMesh.add( mesh );
    createTriangleShapeAddToCompound(compoundShape, mesh);

    // Rør:
    let geometry2 = new THREE.CylinderBufferGeometry(scale.radius,scale.radius, scale.length*3, 32, 32, true);    // NB! Bruker BufferGeometry
    let mesh2 = new THREE.Mesh(geometry2, material);
    mesh2.position.set(0,0 - scale.length*2, 0);
    mesh2.scale.set(1,1,1);

    groupMesh.add( mesh2 );
    createTriangleShapeAddToCompound(compoundShape, mesh2);

    // Sett samme transformasjon på compoundShape som på bottomMesh:
    let mass = 0;
    groupMesh.userData.tag = name;
    setCompoundTransformationBasedOnMesh(scene, compoundShape, groupMesh, mass);
}

function createBox(scene, texturePath, pos, rotation, mass, scale, name) {
    // THREE
    let boxGeometry = new THREE.BoxBufferGeometry(scale.width, scale.height, scale.depth);
    let boxMaterial = null;
    let boxTexture = null;

    if (texturePath != null)  {
        boxTexture = new THREE.TextureLoader().load(texturePath);
        boxMaterial = new THREE.MeshPhongMaterial({map: boxTexture, side: THREE.DoubleSide});
    }
    else {
        boxMaterial = new THREE.MeshPhongMaterial({color: 0xC709C7, side: THREE.DoubleSide});
    }

    let boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boxMesh.receiveShadow = true;
    boxMesh.name = name;
    scene.add(boxMesh);

    // AMMO
    let axis;
    switch (rotation.axis) {
        case "x":
            axis = new THREE.Vector3( 1, 0, 0 );
            break;
        case "y":
            axis = new THREE.Vector3( 0,1, 0);
            break;
        case "z":
            axis = new THREE.Vector3( 0,0, 1);
            break;
        default:
            axis = new THREE.Vector3( 1, 0, 0 );
    }

    let quat = new THREE.Quaternion();
    quat.setFromAxisAngle(axis, rotation.angle);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let boxShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.width * 0.5, scale.height * 0.5, scale.depth * 0.5 ) );
    boxShape.setMargin( 0.05 );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    boxShape.calculateLocalInertia( mass, localInertia );
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, boxShape, localInertia );
    let boxRigidBody = new Ammo.btRigidBody( rbInfo );



    boxRigidBody.setRestitution(0.4);
    boxRigidBody.setFriction(0.9);
    physicsWorld.addRigidBody( boxRigidBody, colGroupBox,  colGroupBox | colGroupBall | colGroupHingePlatform | colGroupTriangle);

    boxMesh.userData.physicsBody = boxRigidBody;
    boxMesh.userData.name = name;
    boxMesh.userData.tag = name;
    rigidBodies.push(boxMesh);

    boxRigidBody.threeObject = boxMesh;
}

function createAmmoTriangleShape(mesh, useConvexShape) {
    let vertices = traverseModel(mesh);   // Fungerer kun sammen med BufferGeometry!!
    let ammoMesh = new Ammo.btTriangleMesh();
    for (let i = 0; i < vertices.length; i += 9)
    {
        let v1_x = vertices[i];
        let v1_y = vertices[i+1];
        let v1_z = vertices[i+2];

        let v2_x = vertices[i+3];
        let v2_y = vertices[i+4];
        let v2_z = vertices[i+5];

        let v3_x = vertices[i+6];
        let v3_y = vertices[i+7];
        let v3_z = vertices[i+8];

        let bv1 = new Ammo.btVector3(v1_x, v1_y, v1_z);
        let bv2 = new Ammo.btVector3(v2_x, v2_y, v2_z);
        let bv3 = new Ammo.btVector3(v3_x, v3_y, v3_z);

        ammoMesh.addTriangle(bv1, bv2, bv3);
    }

    let triangleShape;
    if (useConvexShape)
        triangleShape = new Ammo.btConvexTriangleMeshShape(ammoMesh, false);
    else
        triangleShape = new Ammo.btBvhTriangleMeshShape(ammoMesh, false);

    let threeScale = mesh.scale;
    triangleShape.setLocalScaling(new Ammo.btVector3(threeScale.x, threeScale.y, threeScale.z));
    return triangleShape;
}

function traverseModel(mesh, modelVertices=[]) {
    if (mesh.type === "SkinnedMesh" || mesh.type === "Mesh" || mesh.type === "InstancedMesh") {
        let bufferGeometry = mesh.geometry;
        let attr = bufferGeometry.attributes;
        let position = attr.position;
        let tmpVertices = Array.from(position.array);
        //modelVertices = modelVertices.concat(tmpVertices);
        modelVertices.push(...tmpVertices);
    }
    mesh.children.forEach((child, ndx) => {
        traverseModel(child, modelVertices);
    });
    return modelVertices;
}

export function createRandomBall(scene){
    let xPos = 40;
    let zPos = 0;
    let pos = {x: xPos, y: 50, z: zPos};
    createBall(scene, pos, 0xff0505, 100);
}

function createBall(scene, pos, color, mass){
    let radius = 0.3;
    let quat = {x: 0, y: 0, z: 0, w: 1};

    //AMMO:
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    let ballShape = new Ammo.btSphereShape( radius );
    ballShape.setMargin( 0.05 );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    ballShape.calculateLocalInertia( mass, localInertia );
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, ballShape, localInertia );
    let sphereRigidBody = new Ammo.btRigidBody( rbInfo );
    sphereRigidBody.setRestitution(0.01);
    sphereRigidBody.setFriction(0.2);
    physicsWorld.addRigidBody( sphereRigidBody, colGroupBall, colGroupBall | colGroupBox | colGroupHingePlatform | colGroupTriangle);

    //THREE
    let ballMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({color: color}));
    let origin = transform.getOrigin();
    let orientation = transform.getRotation();
    ballMesh.position.set(origin.x(), origin.y(), origin.z());
    ballMesh.setRotationFromQuaternion(new THREE.Quaternion(orientation.x(), orientation.y(), orientation.z(), orientation.w()));
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    ballMesh.name = "ballMesh";
    scene.add(ballMesh);
    ballMesh.userData.physicsBody = sphereRigidBody;
    ballMesh.userData.name = 'ballMesh';
    ballMesh.userData.tag = 'ballMesh';


    rigidBodies.push(ballMesh);
    sphereRigidBody.threeObject = ballMesh;
}

function createParticles(scene, size, transparent, opacity, sizeAttenuation, color) {
    let texture1 = new THREE.TextureLoader().load("textures/snowflake1.png");
    let texture2 = new THREE.TextureLoader().load("textures/snowflake2.png");
    let texture3 = new THREE.TextureLoader().load("textures/snowflake3.png");
    let texture4 = new THREE.TextureLoader().load("textures/snowflake5.png");

    scene.add(createPoints("animatedParticles", 6000, texture1, size, transparent, opacity,
        sizeAttenuation, color));
    scene.add(createPoints("animatedParticles", 4000, texture2, size, transparent, opacity,
        sizeAttenuation, color));
    scene.add(createPoints("animatedParticles", 3000, texture3, size, transparent, opacity,
        sizeAttenuation, color));
    scene.add(createPoints("animatedParticles", 100000, texture4, size, transparent, opacity,
        sizeAttenuation, color));
}

function createPoints(name, count, texture, size, transparent, opacity, sizeAttenuation, color) {
    let geom = new THREE.BoxGeometry(1000, 1000, 1000, 1, 1, 1);
    let cloudColor = new THREE.Color(color);
    //cloudColor.setHSL(color.getHSL().h, color.getHSL().s, (Math.random()) * color.getHSL().l);

    let material = new THREE.PointsMaterial({
        size : size,
        transparent : transparent,
        opacity : opacity,
        map : texture,
        blending : THREE.AdditiveBlending,
        depthWrite : false,
        sizeAttenuation : sizeAttenuation,
        color : cloudColor
    });

    let range = 1000;
    for (let i = 0; i < count; i++) {
        let particle = new THREE.Vector3(Math.random() * range - range / 2,
            Math.random() * range * 1.5, Math.random() * range - range / 2);
        particle.velocityY = 0.1 + Math.random() / 5;
        particle.velocityX = (Math.random() - 0.5) / 3;
        particle.velocityZ = (Math.random() - 0.5) / 3;
        //particle.lifetime = Math.random() * liferange;
        geom.vertices.push(particle);
    }

    let points = new THREE.Points(geom, material);
    points.name = name;
    points.scale.x = 3;
    points.scale.y = 3;
    points.scale.z = 3;
    points.sortParticles = true;
    return points;
}

// Basert på kode av Werner Farstad. Hentet fra "hingetest0.js". Endret slik at input til funksjonen bestemmer dimensjoner.
function createHingeObject(scene, texturePath, pos, rotation, mass, scale, name) {
    let posStick = pos;     // Cube
    let scaleStick = scale;   // Størrelse på pinnen.
    let massStick = mass;                     // Kuben/"stikka" festes til kula og skal kunne rotere. Må derfor ha masse.

    let posAnchor = pos;    // Sphere, forankringspunkt.
    let radiusAnchor = 1;                         // Størrelse på kula.
    let massAnchor = 0;                     // Sphere, denne skal stå i ro.

    let boardRotAngle = rotation.angle;      // Dersom planet skal roteres.
    let boardRotAxis;
    switch (rotation.axis) {
        case "x":
            boardRotAxis = new THREE.Vector3( 1, 0, 0 );
            break;
        case "y":
            boardRotAxis = new THREE.Vector3( 0,1, 0);
            break;
        case "z":
            boardRotAxis = new THREE.Vector3( 0,0, 1);
            break;
        default:
            boardRotAxis = new THREE.Vector3( 1, 0, 0 );
    }

    let material, texture;
    if (texturePath != null)  {
        texture = new THREE.TextureLoader().load(texturePath);
        material = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide});
    }
    else {
        material = new THREE.MeshPhongMaterial({color: 0xf78a1d, transparent: false, opacity: 1});
    }

    let ballTexture = new THREE.TextureLoader().load("textures/metal.jpg")
    let ballMaterial = new THREE.MeshPhongMaterial({map:ballTexture})

    let transform = new Ammo.btTransform();

    //ThreeJS, kule:
    let threeQuat = new THREE.Quaternion();  // Roterer i forhold til planet (dersom satt).
    threeQuat.setFromAxisAngle( new THREE.Vector3( boardRotAxis.x, boardRotAxis.y, boardRotAxis.z ), boardRotAngle);
    let anchorMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(radiusAnchor), ballMaterial);
    anchorMesh.position.set(posAnchor.x, posAnchor.y, posAnchor.z);
    anchorMesh.setRotationFromQuaternion(threeQuat);
    anchorMesh.castShadow = true;
    anchorMesh.receiveShadow = true;
    scene.add(anchorMesh);
    //AmmoJS, kule:
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( posAnchor.x, posAnchor.y, posAnchor.z ) );
    let btQuat1 = new Ammo.btQuaternion();
    btQuat1.setRotation(new Ammo.btVector3(boardRotAxis.x, boardRotAxis.y, boardRotAxis.z), boardRotAngle);
    transform.setRotation( btQuat1 );
    let motionState = new Ammo.btDefaultMotionState( transform );
    let anchorColShape = new Ammo.btSphereShape( radiusAnchor );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    anchorColShape.calculateLocalInertia( massAnchor, localInertia );
    let rbInfoAnchor = new Ammo.btRigidBodyConstructionInfo( massAnchor, motionState, anchorColShape, localInertia );
    let rbAnchor = new Ammo.btRigidBody( rbInfoAnchor );
    rbAnchor.setRestitution(0.4);
    rbAnchor.setFriction(0.6);
    physicsWorld.addRigidBody( rbAnchor, colGroupHingeSphere, colGroupBall );
    anchorMesh.userData.physicsBody = rbAnchor;
    rigidBodies.push(anchorMesh);

    //ThreeJS, kube/stick:
    let stickMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(), material);
    stickMesh.position.set(posStick.x, posStick.y, posStick.z);
    stickMesh.scale.set(scaleStick.x, scaleStick.y, scaleStick.z);
    stickMesh.setRotationFromQuaternion(threeQuat);
    stickMesh.castShadow = true;
    stickMesh.receiveShadow = true;
    scene.add(stickMesh);
    //AmmoJS, kube/stick:
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( posStick.x, posStick.y, posStick.z ) );
    let btQuat2 = new Ammo.btQuaternion();
    btQuat2.setRotation(new Ammo.btVector3(boardRotAxis.x, boardRotAxis.y, boardRotAxis.z), boardRotAngle); // + Math.PI/8);
    transform.setRotation( btQuat2 );
    motionState = new Ammo.btDefaultMotionState( transform );
    let stickColShape = new Ammo.btBoxShape( new Ammo.btVector3( scaleStick.x * 0.5, scaleStick.y * 0.5, scaleStick.z * 0.5 ) );
    localInertia = new Ammo.btVector3( 0, 0, 0 );
    stickColShape.calculateLocalInertia( massStick, localInertia );
    let rbInfoStick = new Ammo.btRigidBodyConstructionInfo( massStick, motionState, stickColShape, localInertia );
    let rbStick = new Ammo.btRigidBody(rbInfoStick);
    rbStick.setRestitution(0.4);
    rbStick.setFriction(0.6);
    physicsWorld.addRigidBody(rbStick, colGroupHingePlatform, colGroupBall |  colGroupBox);
    stickMesh.userData.physicsBody = rbStick;

    //Ammo, hengsel: SE F.EKS: https://www.panda3d.org/manual/?title=Bullet_Constraints#Hinge_Constraint:
    let anchorPivot = new Ammo.btVector3( 0, 1, 0 );
    let stickPivot = new Ammo.btVector3( 0, 0, 0 );
    const anchorAxis = new Ammo.btVector3(0,0,1);
    const stickAxis = new Ammo.btVector3(0,1,0);
    let hingeConstraint = new Ammo.btHingeConstraint(rbAnchor, rbStick, anchorPivot, stickPivot, anchorAxis, stickAxis, false);
    // NB! LA STÅ!
    let lowerLimit = -Math.PI/4; //Math.PI/2;
    let upperLimit = Math.PI/4; //-Math.PI/2;
    hingeConstraint.setLimit( lowerLimit, upperLimit, 0.9, 0.3, 0.8);

    physicsWorld.addConstraint( hingeConstraint, false );
    rigidBodies.push(stickMesh);
}

function createTriangleShapeAddToCompound(compoundShape, mesh) {
    let shape = createAmmoTriangleShape(mesh, false);
    let shapeTrans = new Ammo.btTransform();
    shapeTrans.setIdentity();
    shapeTrans.setOrigin(new Ammo.btVector3(mesh.position.x,mesh.position.y,mesh.position.z));
    let quat = mesh.quaternion;
    shapeTrans.setRotation( new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w) );
    compoundShape.addChildShape(shapeTrans, shape);
}

// Setter transformasjon på compoundShape tilsvarende THREE.mesh sin transformasjon.
function setCompoundTransformationBasedOnMesh(scene, compoundShape, mesh, mass) {
    let compoundShapeTrans = new Ammo.btTransform();
    compoundShapeTrans.setIdentity();
    compoundShapeTrans.setOrigin(new Ammo.btVector3(mesh.position.x,mesh.position.y,mesh.position.z));
    let quat = mesh.quaternion;
    compoundShapeTrans.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( compoundShapeTrans );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    compoundShape.setLocalScaling(new Ammo.btVector3(mesh.scale.x,mesh.scale.y, mesh.scale.x));
    //compoundShape.setMargin( 0.04 );
    compoundShape.calculateLocalInertia( mass, localInertia );
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, compoundShape, localInertia );
    let rigidBodyCompound = new Ammo.btRigidBody(rbInfo);
    rigidBodyCompound.setFriction(0.4);
    rigidBodyCompound.setRestitution(0.6);
    rigidBodyCompound.setActivationState(4);    //deaktiveres ikke!
    scene.add(mesh);

    physicsWorld.addRigidBody(rigidBodyCompound, colGroupTriangle,  colGroupBox | colGroupBall | colGroupHingePlatform);
    physicsWorld.updateSingleAabb(rigidBodyCompound) ;
    mesh.userData.physicsBody = rigidBodyCompound;
    rigidBodies.push(mesh);
}

function moveStaticKinematicObject(direction, rb) {
    let transform1 = new Ammo.btTransform();
    let ms1 = rb.getMotionState();
    ms1.getWorldTransform( transform1 );
    let curPosition1 = transform1.getOrigin();
    transform1.setOrigin(new Ammo.btVector3(curPosition1.x() + direction.x, curPosition1.y() + direction.y, curPosition1.z() + direction.z));
    ms1.setWorldTransform(transform1);
}

// Org. kode av Werner Farstad. Hentet fra "ammoShapes4.js".
function loadGLTF(pos) {
    // Bruker GLTFLoader for å laste .gltf / .glb filer.
    const gltfLoader = new GLTFLoader();
    let gltfModelName, gltfModelMass, gltfModelStartPos, gltfModelScale;
    gltfModelName = './models/scene.gltf';
    gltfModelMass = 0;
    gltfModelStartPos = {x: pos.x, y:pos.y, z: pos.z};
    gltfModelScale = {x: 3, y: 3 , z:3};

    gltfLoader.load(gltfModelName, (gltfModel) => {
        const clonedScene = SkeletonUtils.clone(gltfModel.scene);
        const rootModelMesh = new THREE.Object3D();
        rootModelMesh.add(clonedScene);

        // Bruker AnimationMixer til å vise animasjoner, AnimationClip's.
        // The stored data forms only the basis for the animations - actual playback is controlled by
        // the AnimationMixer.
        //animationMixer = new THREE.AnimationMixer(clonedScene);

        console.log(dumpObject(rootModelMesh).join('\n'));
        createTriangleMeshShape(scene, rootModelMesh, gltfModelMass, gltfModelScale, gltfModelStartPos);

        // Henter clip vha. index:
        //const firstClip = gltfModel.animations[0];
        //const action0 = animationMixer.clipAction( firstClip );
        //action0.play();

        console.log(rigidBodies[13]);
    });
}

// Org. kode av Werner Farstad. Hentet fra "ammoShapes4.js".
function createTriangleMeshShape(scene, triangleMesh, massTriangleMesh, scale, position) {
    let compoundShape = new Ammo.btCompoundShape();
    let triangleShape = createAmmoTriangleShape(triangleMesh, scale);
    let triangleShapeTrans = new Ammo.btTransform();
    triangleShapeTrans.setIdentity();
    triangleShapeTrans.setOrigin(new Ammo.btVector3(0,0,0));
    let tsq = triangleMesh.quaternion;
    triangleShapeTrans.setRotation( new Ammo.btQuaternion(tsq.x, tsq.y, tsq.z, tsq.w) );
    compoundShape.addChildShape(triangleShapeTrans, triangleShape);

    let compoundShapeTrans = new Ammo.btTransform();
    compoundShapeTrans.setIdentity();
    compoundShapeTrans.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));

    let quat = new THREE.Quaternion();
    quat.setFromAxisAngle(new THREE.Vector3( 0, 1, 0 ), Math.PI/2);

    compoundShapeTrans.setRotation( new Ammo.btQuaternion( quat.x,quat.y,quat.z,quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( compoundShapeTrans );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    compoundShape.setMargin( 0.04 );
    compoundShape.calculateLocalInertia( massTriangleMesh, localInertia );
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( massTriangleMesh, motionState, compoundShape, localInertia );
    let rigidBodyCompound = new Ammo.btRigidBody(rbInfo);
    rigidBodyCompound.setFriction(0.9);
    rigidBodyCompound.setRestitution(0.2);
    rigidBodyCompound.setActivationState(4);

    let orientation = compoundShapeTrans.getRotation();
    triangleMesh.setRotationFromQuaternion(new THREE.Quaternion(orientation.x(), orientation.y(), orientation.z(), orientation.w()));
    triangleMesh.castShadow = true;
    triangleMesh.scale.x=scale.x;
    triangleMesh.scale.y=scale.y;
    triangleMesh.scale.z=scale.z;
    triangleMesh.receiveShadow = true;
    scene.add(triangleMesh);

    physicsWorld.addRigidBody(rigidBodyCompound, colGroupTriangle,  colGroupBox | colGroupBall | colGroupHingeSphere | colGroupHingePlatform | colGroupTriangle );
    physicsWorld.updateSingleAabb(rigidBodyCompound) ;
    triangleMesh.userData.physicsBody = rigidBodyCompound;
    triangleMesh.userData.tag = "triangle";
    rigidBodies.push(triangleMesh);

    rigidBodyCompound.threeObject = triangleMesh;
}

// Skriver ut modellstrukturen.
// FRA: https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html
function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
        const isLast = ndx === lastNdx;
        dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}





