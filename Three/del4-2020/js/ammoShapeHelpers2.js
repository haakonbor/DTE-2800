/*
:::
::: Just add your clearForces() and velocities to it to stop the body from moving on from the new position
::: Inertia: http://dmorris.net/projects/tutorials/inertia.tensor.summary.pdf
:::
 */
import * as THREE from "../../lib/three/build/three.module.js";
import {ConvexBufferGeometry} from '../../lib/three/examples/jsm/geometries/ConvexGeometry.js';

let physicsWorld;
let tmpTrans;
let colGroupPlane = 1, colGroupBall = 2, colGroupConvex = 4, colGroupCompound = 8, colGroupMoveable = 16, colGroupTriangle = 32;
let rigidBodies = [];
let rbMoveableConvex;
const TERRAIN_SIZE = 50;
const terrainWidth = 128;
const terrainDepth = 128;
export const DEBUG = false;

export function setupPhysicsWorld(){

	tmpTrans = new Ammo.btTransform();

	let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
		dispatcher          = new Ammo.btCollisionDispatcher(collisionConfiguration),
		overlappingPairCache= new Ammo.btDbvtBroadphase(),
		solver              = new Ammo.btSequentialImpulseConstraintSolver();

	physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
}

export function updatePhysics( deltaTime ){
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
}

export function createTerrain(scene){
	// Endret til BoxBufferGeometry:
	let terrainGeometry = new THREE.BoxBufferGeometry( TERRAIN_SIZE * 2, 2,TERRAIN_SIZE * 2);
	let groundMaterial = new THREE.MeshPhongMaterial( { color: 0xC709C7, side: THREE.DoubleSide } );
	let terrainMesh = new THREE.Mesh( terrainGeometry, groundMaterial );
	terrainMesh.receiveShadow = true;
	scene.add( terrainMesh );

	// Ammo.js
	let pos = {x: 0, y: 0, z: 0};
	let scale = {x: TERRAIN_SIZE * 2, y: 2 , z:TERRAIN_SIZE * 2};
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 0;

	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let terrainShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
	terrainShape.setMargin( 0.05 );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	terrainShape.calculateLocalInertia( mass, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, terrainShape, localInertia );
	let terrainRigidBody = new Ammo.btRigidBody( rbInfo );
	terrainRigidBody.setRestitution(0.8);
	terrainRigidBody.setFriction(0.9);
	physicsWorld.addRigidBody( terrainRigidBody, colGroupPlane,  colGroupBall | colGroupCompound | colGroupMoveable | colGroupConvex | colGroupTriangle);

	terrainMesh.userData.physicsBody = terrainRigidBody;
	terrainMesh.userData.name = 'terrain';
	rigidBodies.push(terrainMesh);
}

export function createRandomBall(scene){
	let xPos = -14 + Math.random() * 28;
	let zPos = 15 + Math.random() * -50;
	let pos = {x: xPos, y: 50, z: zPos};
	createBall(scene, pos, 0xff0505, 5);
}

export function createBall(scene, pos, color, mass){
	let radius = 1;
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
	sphereRigidBody.setRestitution(0.6);
	sphereRigidBody.setFriction(0.8);
	physicsWorld.addRigidBody( sphereRigidBody, colGroupBall, colGroupBall | colGroupPlane | colGroupCompound | colGroupConvex | colGroupMoveable | colGroupTriangle);

	//THREE
	let ballMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({color: color}));
	let origin = transform.getOrigin();
	let orientation = transform.getRotation();
	ballMesh.position.set(origin.x(), origin.y(), origin.z());
	ballMesh.setRotationFromQuaternion(new THREE.Quaternion(orientation.x(), orientation.y(), orientation.z(), orientation.w()));
	ballMesh.castShadow = true;
	ballMesh.receiveShadow = true;
	scene.add(ballMesh);
	ballMesh.userData.physicsBody = sphereRigidBody;
	ballMesh.userData.name = 'ballMesh';
	rigidBodies.push(ballMesh);
}

export function createCompoundDumbellShape(scene) {

	// AMMO:
	let dumbellMass = 100;
	let pRod = new Ammo.btBoxShape( new Ammo.btVector3( 30/2, 2/2, 2/2) );
	let pLoadLeft = new Ammo.btSphereShape( 2.5 );
	let pLoadRight = new Ammo.btSphereShape( 2.5 );
	let pCompound = new Ammo.btCompoundShape();

	let yPos = 0;
	let trans1 = new Ammo.btTransform();
	trans1.setIdentity();
	trans1.setOrigin(new Ammo.btVector3(0, yPos, 0));
	pCompound.addChildShape(trans1, pRod);

	let trans2 = new Ammo.btTransform();
	trans2.setIdentity();
	trans2.setOrigin(new Ammo.btVector3(-17.5, yPos, 0));
	pCompound.addChildShape(trans2, pLoadLeft);

	let trans3 = new Ammo.btTransform();
	trans3.setIdentity();
	trans3.setOrigin(new Ammo.btVector3(17.5, yPos, 0));
	pCompound.addChildShape(trans3, pLoadRight);

	let trans4 = new Ammo.btTransform();
	trans4.setIdentity();
	trans4.setOrigin(new Ammo.btVector3(-10, 20, -10));
	let motionState = new Ammo.btDefaultMotionState( trans4 );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	pCompound.calculateLocalInertia( dumbellMass, localInertia );
	let rbCompound = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(dumbellMass, motionState, pCompound, localInertia));
	// rbCompound.setActivationState(4);
	rbCompound.setRestitution(0.2);
	rbCompound.setFriction(0.3);

	physicsWorld.addRigidBody(rbCompound, colGroupCompound, colGroupCompound | colGroupBall | colGroupPlane | colGroupConvex | colGroupMoveable | colGroupTriangle);

	// THREE:
	// Rod:
	let compoundMesh = new THREE.Group();
	let geometryRod = new THREE.BoxBufferGeometry( 30, 2, 2);
	let meshRod = new THREE.Mesh(geometryRod, new THREE.MeshPhongMaterial({color: 0xf78a1d}));
	//let pRodTrans = new Ammo.btTransform();
	let originRod = trans1.getOrigin();
	let orientationRod = trans1.getRotation();
	console.log(originRod.y());
	meshRod.position.set(originRod.x(), originRod.y(), originRod.z());
	meshRod.setRotationFromQuaternion(new THREE.Quaternion(orientationRod.x(), orientationRod.y(), orientationRod.z(), orientationRod.w()));
	meshRod.castShadow = true;
	compoundMesh.add(meshRod);

	// Left bell:
	let leftBellMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(2.5, 32, 32), new THREE.MeshPhongMaterial({color: 0x09F099}));
	let originLeft = trans2.getOrigin();
	let orientationLeft = trans2.getRotation();
	console.log(originLeft.x());
	leftBellMesh.position.set(originLeft.x(), originLeft.y(), originLeft.z());
	leftBellMesh.setRotationFromQuaternion(new THREE.Quaternion(orientationLeft.x(), orientationLeft.y(), orientationLeft.z(), orientationLeft.w()));
	leftBellMesh.castShadow = true;
	compoundMesh.add(leftBellMesh);

	// Right bell:
	let rightBellMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(2.5, 32, 32), new THREE.MeshPhongMaterial({color: 0x09F099}));
	let originRight = trans3.getOrigin();
	console.log(originRight.x());
	let orientationRight = trans3.getRotation();
	rightBellMesh.position.set(originRight.x(), originRight.y(), originRight.z());
	rightBellMesh.setRotationFromQuaternion(new THREE.Quaternion(orientationRight.x(), orientationRight.y(), orientationRight.z(), orientationRight.w()));
	rightBellMesh.castShadow = true;
	compoundMesh.add(rightBellMesh);
	compoundMesh.userData.physicsBody = rbCompound;

	rigidBodies.push(compoundMesh);
	scene.add(compoundMesh);
}

export function createCompoundTVShape(scene) {

	// AMMO:
	let screenlMass = 30;
	let scaleScreen = {x: 16, y: 8, z: 1};
	let scaleFoot = {x: 8, y: 1, z: 4};
	let scaleCyl = {x: 2, y: 1.5, z: 2};

	let screenShape = new Ammo.btBoxShape( new Ammo.btVector3( scaleScreen.x*0.5, scaleScreen.y*0.5, scaleScreen.z*0.5) );
	let cylShape = new Ammo.btCylinderShape( new Ammo.btVector3(scaleCyl.x*0.5, scaleCyl.y*0.5, scaleCyl.z*0.5) );
	let footShape = new Ammo.btBoxShape( new Ammo.btVector3( scaleFoot.x * 0.5, scaleFoot.y * 0.5, scaleFoot.z * 0.5 ) );
	let compoundShape = new Ammo.btCompoundShape();

	let trans1 = new Ammo.btTransform();
	trans1.setIdentity();
	trans1.setOrigin(new Ammo.btVector3(0, 6.5, 0));
	compoundShape.addChildShape(trans1, screenShape);

	let trans2 = new Ammo.btTransform();
	trans2.setIdentity();
	trans2.setOrigin(new Ammo.btVector3(0, 2, 0));
	compoundShape.addChildShape(trans2, cylShape);

	let trans3 = new Ammo.btTransform();
	trans3.setIdentity();
	trans3.setOrigin(new Ammo.btVector3(0, 1, 0));
	compoundShape.addChildShape(trans3, footShape);

	let trans4 = new Ammo.btTransform();
	trans4.setIdentity();
	trans4.setOrigin(new Ammo.btVector3(0, 10, 0));      //NB!!
	let motionState = new Ammo.btDefaultMotionState( trans4 );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	compoundShape.calculateLocalInertia( screenlMass, localInertia );
	let rbCompound = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(screenlMass, motionState, compoundShape, localInertia));
	// rbCompound.setActivationState(4);
	rbCompound.setRestitution(0.2);
	rbCompound.setFriction(0.9);

	physicsWorld.addRigidBody(rbCompound, colGroupCompound, colGroupCompound | colGroupBall | colGroupPlane | colGroupConvex | colGroupMoveable | colGroupTriangle);

	// THREE:
	let compoundMesh = new THREE.Group();
	// Screen:
	let geometryScreen = new THREE.BoxBufferGeometry(scaleScreen.x, scaleScreen.y, scaleScreen.z);
	let meshScreen = new THREE.Mesh(geometryScreen, new THREE.MeshPhongMaterial({color: 0xf78a1d}));
	let originScreen = trans1.getOrigin();
	let orientationScreen = trans1.getRotation();
	meshScreen.position.set(originScreen.x(), originScreen.y(), originScreen.z());
	meshScreen.setRotationFromQuaternion(new THREE.Quaternion(orientationScreen.x(), orientationScreen.y(), orientationScreen.z(), orientationScreen.w()));
	meshScreen.castShadow = true;
	compoundMesh.add(meshScreen);

	// glass
	let texture = new THREE.TextureLoader().load("textures/bird1.png");
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(3, 2);
	let geometryGlass = new THREE.BoxBufferGeometry(scaleScreen.x-0.3, scaleScreen.y-0.3, scaleScreen.z+0.1);
	let meshGlass= new THREE.Mesh(geometryGlass, new THREE.MeshPhongMaterial({color: 0xFFFFFF, map : texture}));
	let originGlass = trans1.getOrigin();
	let orientationGlass = trans1.getRotation();
	meshGlass.position.set(originGlass.x(), originGlass.y(), originGlass.z());
	meshGlass.setRotationFromQuaternion(new THREE.Quaternion(orientationGlass.x(), orientationGlass.y(), orientationGlass.z(), orientationGlass.w()));
	compoundMesh.add(meshGlass);

	// cylinder:
	let cylinderMesh = new THREE.Mesh(new THREE.CylinderBufferGeometry(scaleCyl.x, scaleCyl.x, scaleCyl.y, 32), new THREE.MeshPhongMaterial({color: 0xf78a1d}));
	let originCylinder = trans2.getOrigin();
	let orientationCylinder = trans2.getRotation();
	cylinderMesh.position.set(originCylinder.x(), originCylinder.y(), originCylinder.z());
	cylinderMesh.setRotationFromQuaternion(new THREE.Quaternion(orientationCylinder.x(), orientationCylinder.y(), orientationCylinder.z(), orientationCylinder.w()));
	cylinderMesh.castShadow = true;
	compoundMesh.add(cylinderMesh);

	// foot:
	let footGeometry = new THREE.BoxBufferGeometry(scaleFoot.x, scaleFoot.y, scaleFoot.z);
	let footMesh = new THREE.Mesh(footGeometry, new THREE.MeshPhongMaterial({color: 0xf78a1d}));
	let originFoot = trans3.getOrigin();
	let orientationRight = trans3.getRotation();
	footMesh.position.set(originFoot.x(), originFoot.y(), originFoot.z());
	footMesh.setRotationFromQuaternion(new THREE.Quaternion(orientationRight.x(), orientationRight.y(), orientationRight.z(), orientationRight.w()));
	footMesh.castShadow = true;
	compoundMesh.add(footMesh);
	compoundMesh.userData.physicsBody = rbCompound;

	rigidBodies.push(compoundMesh);
	scene.add(compoundMesh);
}

function createRandomConvexGeometry() {
	// add 100 random points / spheres:
	let points = [];
	for (let i = 0; i < 100; i++) {
		let randomX = -4 + Math.round(Math.random() * 8);
		let randomY = -9 + Math.round(Math.random() * 18);
		let randomZ = -8 + Math.round(Math.random() * 16);
		points.push(new THREE.Vector3(randomX, randomY, randomZ));
	}
	return points;
}

// "Konveks omhylning"
// https://en.wikipedia.org/wiki/Convex_hull
export function createConvexHullShape(scene) {

	let pos = {x: -10, y:20, z:-10};
	let massConvex = 30;
	// Genererer vertekser for convex:
	let vertices = createRandomConvexGeometry();  //new THREE.DodecahedronGeometry( 3 ).vertices;

	// AMMO:
	let convexShape = new Ammo.btConvexHullShape(); //( new Ammo.btVector3( scaleScreen.x * 0.5, scaleScreen.y * 0.5, scaleScreen.z * 0.5 ) );
	for ( var i = 0; i < vertices.length; i ++ ) {
		convexShape.addPoint(new Ammo.btVector3(vertices[i].x, vertices[i].y, vertices[i].z))
	}
	convexShape.setMargin( 0.05 );
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
	let motionState = new Ammo.btDefaultMotionState( transform );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	convexShape.calculateLocalInertia( massConvex, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( massConvex, motionState, convexShape, localInertia );
	let rbConvex = new Ammo.btRigidBody(rbInfo);
	rbConvex.setFriction(0.8);
	rbConvex.setRestitution(0.8);
	physicsWorld.addRigidBody(rbConvex, colGroupConvex, colGroupBall | colGroupPlane | colGroupCompound | colGroupMoveable | colGroupTriangle);

	// THREE:
	var geometry = new ConvexBufferGeometry( vertices );
	let convexMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color: 0x0EFE1d}));
	let origin = transform.getOrigin();
	let orientation = transform.getRotation();
	convexMesh.position.set(origin.x(), origin.y(), origin.z());
	convexMesh.setRotationFromQuaternion(new THREE.Quaternion(orientation.x(), orientation.y(), orientation.z(), orientation.w()));
	convexMesh.castShadow = true;
	scene.add(convexMesh);
	convexMesh.userData.physicsBody = rbConvex;
	rigidBodies.push(convexMesh);
}

export function createMoveableShape(scene) {
	// Three:
	let origin = {x: 10, y:2.8, z:10};
	let massConvex = 0;

	let vertices = new THREE.DodecahedronGeometry( 3 ).vertices;
	var geometry = new ConvexBufferGeometry( vertices );
	let scaleConvex = {x: 1, y: 1, z: 1};
	let convexMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color: 0x070aFd}));
	convexMesh.position.set(origin.x, origin.y, origin.z);
	//convexMesh.scale.set(scaleConvex.x * 0.5, scaleConvex.y * 0.5, scaleConvex.z * 0.5);
	convexMesh.castShadow = true;
	scene.add(convexMesh);
	// Ammo:
	let convexShape = new Ammo.btConvexHullShape(); //( new Ammo.btVector3( scaleScreen.x * 0.5, scaleScreen.y * 0.5, scaleScreen.z * 0.5 ) );
	for ( var i = 0; i < vertices.length; i ++ ) {
		convexShape.addPoint(new Ammo.btVector3(vertices[i].x, vertices[i].y, vertices[i].z))
	}
	convexShape.setMargin( 0.05 );
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(origin.x, origin.y, origin.z));
	let motionState = new Ammo.btDefaultMotionState( transform );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	convexShape.calculateLocalInertia( massConvex, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( massConvex, motionState, convexShape, localInertia );
	rbMoveableConvex = new Ammo.btRigidBody(rbInfo);
	// NB! DISSE er avgjørende for å kunne flytte på objektet:
	rbMoveableConvex.setCollisionFlags(rbMoveableConvex.getCollisionFlags() | 2);   // BODYFLAG_KINEMATIC_OBJECT = 2 betyr kinematic object, masse=0 men kan flyttes!!
	rbMoveableConvex.setActivationState(4);                                         // Never sleep, BODYSTATE_DISABLE_DEACTIVATION = 4
	rbMoveableConvex.setFriction(0.8);
	rbMoveableConvex.setRestitution(0.8);
	physicsWorld.addRigidBody(rbMoveableConvex, colGroupMoveable, colGroupBall | colGroupPlane | colGroupCompound | colGroupConvex | colGroupTriangle);

	convexMesh.userData.physicsBody = rbMoveableConvex;
	rigidBodies.push(convexMesh);
}

// For at en rigid-body (RB) skal være flyttbar følgende settes:
// rbMoveableConvex.setCollisionFlags(rbMoveableConvex.getCollisionFlags() | 2);    // BODYFLAG_KINEMATIC_OBJECT = 2 betyr kinematic object, masse=0 men kan flyttes!!
// rbMoveableConvex.setActivationState(4);                                          // Slipper å aktivere ...
export function moveStaticKinematicObject(direction) {
	let transform1 = new Ammo.btTransform();
	let ms1 = rbMoveableConvex.getMotionState();
	ms1.getWorldTransform( transform1 );
	let curPosition1 = transform1.getOrigin();
	transform1.setOrigin(new Ammo.btVector3(curPosition1.x() + direction.x, curPosition1.y() + direction.y, curPosition1.z() + direction.z));
	ms1.setWorldTransform(transform1);
}

// Pinnen er forankret i kula (som står i ro, dvs. masse=0).
// Man bestemmer selv om ankret (Kula) skal tegnes/vises.
// Pinnen kan beveges - gjøres vha. applyCentralImpulse
export function createHingeObject(scene) {
	let posStick = {x: -4, y: 0, z: 0};     // Cube
	let scaleStick = {x: 15, y: 2, z: 2};   // Størrelse på pinnen.
	let massStick = 50;                     // Kuben/"stikka" festes til kula og skal kunne rotere. Må derfor ha masse.

	let posAnchor = {x: -4, y: 5, z: 0};    // Sphere, forankringspunkt.
	let radiusAnchor = 2;                         // Størrelse på kula.
	let massAnchor = 0;                     // Sphere, denne skal stå i ro.

	let transform = new Ammo.btTransform();

	//ThreeJS, kule:
	let threeQuat = new THREE.Quaternion();  // Roterer i forhold til planet (dersom satt).
	threeQuat.setFromAxisAngle( new THREE.Vector3( boardRotAxis.x, boardRotAxis.y, boardRotAxis.z ), boardRotAngle);
	anchorMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(radiusAnchor), new THREE.MeshPhongMaterial({color: 0xb846db, transparent: true, opacity: 0.5}));
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
	stickMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xf78a1d}));
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
	rbStick = new Ammo.btRigidBody(rbInfoStick);
	rbStick.setRestitution(0.4);
	rbStick.setFriction(0.6);
	physicsWorld.addRigidBody(rbStick, colGroupStick, colGroupBall | colGroupPlane | colGroupBox);
	stickMesh.userData.physicsBody = rbStick;

	//Ammo, hengsel: SE F.EKS: https://www.panda3d.org/manual/?title=Bullet_Constraints#Hinge_Constraint:
	let anchorPivot = new Ammo.btVector3( 0, 1, 0 );
	let stickPivot = new Ammo.btVector3( - scaleStick.x * 0.5, 0, 0 );
	const anchorAxis = new Ammo.btVector3(0,1,0);
	const stickAxis = new Ammo.btVector3(0,1,0);
	let hingeConstraint = new Ammo.btHingeConstraint(rbAnchor, rbStick, anchorPivot, stickPivot, anchorAxis, stickAxis, false);
	// NB! LA STÅ!
	let lowerLimit = -1.4; //Math.PI/2;
	let upperLimit = 1.4; //-Math.PI/2;
	hingeConstraint.setLimit( lowerLimit, upperLimit, 0.9, 0.3, 0.8);

	physicsWorld.addConstraint( hingeConstraint, false );
	rigidBodies.push(stickMesh);
}
