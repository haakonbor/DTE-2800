import * as THREE from "../../lib/three/build/three.module.js";
import {ConvexBufferGeometry} from '../../lib/three/examples/jsm/geometries/ConvexGeometry.js';

let physicsWorld;
let tmpTrans;
let colGroupPlane = 1, colGroupBall = 2, colGroupConvex = 4, colGroupCompound = 8, colGroupMoveable = 16, colGroupTriangle = 32;
let rigidBodies = [];
let rbMoveableConvex;
const TERRAIN_SIZE = 50;
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
	// NB! Endret til BoxBufferGeometry ( i stedet for PlaneGeometry):
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
	let mass = 0.1 + Math.random();
	createBall(scene, pos, 0xff0505, mass, mass);
}

export function createBall(scene, pos, color, radius, mass){
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
// rbMoveableConvex.setCollisionFlags(rbMoveableConvex.getCollisionFlags() | 2); // BODYFLAG_KINEMATIC_OBJECT = 2 betyr kinematic object, masse=0 men kan flyttes!!
// rbMoveableConvex.setActivationState(4); // Slipper å aktivere ...
export function moveStaticKinematicObject(direction) {
	let transform1 = new Ammo.btTransform();
	let ms1 = rbMoveableConvex.getMotionState();
	ms1.getWorldTransform( transform1 );
	let curPosition1 = transform1.getOrigin();
	transform1.setOrigin(new Ammo.btVector3(curPosition1.x() + direction.x, curPosition1.y() + direction.y, curPosition1.z() + direction.z));
	ms1.setWorldTransform(transform1);
}

// Vilkårlig shape: Må legges inn i en compound shape for å fungere.
// MERK! Rigid body-objekter basert på btBvhTriangleMeshShape kan ikke kollidere med hverandre.
// MERK! Bruker kun THREE... BufferGeometry klasser.
// MERK! Skalering, fra doc: Instead of scaling the rigid body you will need to instead scale the shape used for collision detection.
// This is done by calling btCollisionShape::setLocalScaling(). You may need to call btCollisionWorld::updateSingleAABB( rigidbody )
export function createTriangleMeshShape(scene, mesh, mass) {
	// TriangleShape:
	let shape = createAmmoTriangleShape(mesh, true);
	let shapeTrans = new Ammo.btTransform();
	shapeTrans.setIdentity();

	// Compound:
	let compoundShape = new Ammo.btCompoundShape();
	compoundShape.addChildShape(shapeTrans, shape);
	let position = mesh.position;
	let quat = mesh.quaternion;
	let compoundShapeTrans = new Ammo.btTransform();
	compoundShapeTrans.setIdentity();
	compoundShapeTrans.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
	compoundShapeTrans.setRotation( new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w) );
	let motionState = new Ammo.btDefaultMotionState( compoundShapeTrans );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	compoundShape.setMargin( 0.04 );
	compoundShape.calculateLocalInertia( mass, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, compoundShape, localInertia );
	let rigidBodyCompound = new Ammo.btRigidBody(rbInfo);
	rigidBodyCompound.setFriction(0.4);
	rigidBodyCompound.setRestitution(0.6);
	scene.add(mesh);
	physicsWorld.addRigidBody(rigidBodyCompound, colGroupTriangle, colGroupTriangle | colGroupPlane | colGroupBall | colGroupCompound | colGroupMoveable | colGroupConvex);
	physicsWorld.updateSingleAabb(rigidBodyCompound) ;
	mesh.userData.physicsBody = rigidBodyCompound;
	rigidBodies.push(mesh);
}

// Lager en kaffekopp bestående av ulike deler:
// MERK! Rigid body-objekter basert på btBvhTriangleMeshShape kan ikke kollidere med hverandre.
// MERK! Bruker kun THREE... BufferGeometry klasser.
export function createCupObject(scene) {
	//Ammo-konteiner:
	let compoundShape = new Ammo.btCompoundShape();
	//Three-konteiner:
	let groupMesh = new THREE.Group();
	groupMesh.position.x = 10
	groupMesh.position.y = 25;
	groupMesh.position.z = -15;
	groupMesh.scale.set(0.5,0.5,0.5);

	// Teksturer:
	let cupTexture = new THREE.TextureLoader().load('textures/metal_tread_plate1.jpg');
	let cupMaterial = new THREE.MeshPhongMaterial({map : cupTexture, side: THREE.DoubleSide});	//NB! MeshPhongMaterial

	// Bunnen/sylinder:
	let bottomGeometry = new THREE.CylinderBufferGeometry( 8, 8, 1, 32 );
	let bottomMesh = new THREE.Mesh( bottomGeometry, cupMaterial );
	//bottomMesh.scale.set(2.5,2.5,2.5);
	bottomMesh.position.x = 0;
	bottomMesh.position.y = 0;
	bottomMesh.position.z = 0;
	groupMesh.add( bottomMesh );
	createTriangleShapeAddToCompound(compoundShape, bottomMesh);

	// Hanken/Torus:
	let torusGeometry = new THREE.TorusBufferGeometry( 9.2, 2, 16, 100, Math.PI );
	let torusMesh = new THREE.Mesh( torusGeometry, cupMaterial );
	torusMesh.rotation.z = -Math.PI/2 - Math.PI/14;
	torusMesh.position.x = 15.8;
	torusMesh.position.y = 15;
	torusMesh.scale.set(1,1, 1);
	groupMesh.add( torusMesh );
	createTriangleShapeAddToCompound(compoundShape, torusMesh);

	//Koppen/Lathe:
	let points = [];
	for (let x = 0; x < 1; x=x+0.1) {
		let y = Math.pow(x,5)*2;
		points.push(new THREE.Vector2(x*20,y*13));
	}
	let latheGeometry = new THREE.LatheBufferGeometry(points, 128, 0, 2 * Math.PI);
	let latheMesh = new THREE.Mesh(latheGeometry, cupMaterial);
	latheMesh.updateMatrix();
	latheMesh.updateMatrixWorld(true);
	latheMesh.scale.set(1,1, 1);
	groupMesh.add( latheMesh );
	createTriangleShapeAddToCompound(compoundShape, latheMesh);

	// Kaffen, sylinder:
	let coffeeTexture = new THREE.TextureLoader().load('textures/tile2.png');
	let coffeeGeometry = new THREE.CylinderBufferGeometry( 18, 18, 0.2, 32 );
	let coffeeMaterial = new THREE.MeshPhongMaterial({color:0x7F4600, map : coffeeTexture});
	let coffeeMesh = new THREE.Mesh( coffeeGeometry, coffeeMaterial );
	coffeeMesh.position.x = 0;
	coffeeMesh.position.y = 24;
	coffeeMesh.position.z = 0;
	groupMesh.add( coffeeMesh );
	createTriangleShapeAddToCompound(compoundShape, coffeeMesh);

	// Sett samme transformasjon på compoundShape som på bottomMesh:
	let massCup = 1;
	setCompoundTransformationBasedOnMesh(scene, compoundShape, groupMesh, massCup);
}

export function createHeliObject(scene) {
	//Ammo-Konteiner:
	let compoundShape = new Ammo.btCompoundShape();
	//Three-Konteiner:
	let helicopter = new THREE.Group();
	helicopter.position.x = -15
	helicopter.position.y = 70;
	helicopter.position.z = 20;
	helicopter.scale.set(0.3,0.3, 0.3);

	//Cockpit: three.js :
	let cockpitTexture = new THREE.TextureLoader().load('textures/metal1.jpg');
	let cockpitGeometry = new THREE.SphereBufferGeometry(5, 32, 32);
	let cockpitMaterial = new THREE.MeshPhongMaterial({ map: cockpitTexture });
	let cockpitMesh = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
	cockpitMesh.castShadow = true;
	cockpitMesh.name = "cockpit";
	cockpitMesh.position.x = 0;
	cockpitMesh.position.y = 0;
	cockpitMesh.position.z = 0;
	helicopter.add(cockpitMesh);
	createTriangleShapeAddToCompound(compoundShape, cockpitMesh);

	//Body:
	let bodyTexture = new THREE.TextureLoader().load('textures/metal1.jpg');
	let bodyGeometry = new THREE.CylinderBufferGeometry(1.0, 4, 12, 8, 4, false);
	let bodyMaterial = new THREE.MeshPhongMaterial({ map: bodyTexture });
	let bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
	bodyMesh.castShadow = true;
	bodyMesh.name = "body";
	bodyMesh.rotation.z = Math.PI / 2;
	bodyMesh.position.x = -7;
	bodyMesh.position.y = 0;
	bodyMesh.position.z = 0;
	helicopter.add(bodyMesh);
	createTriangleShapeAddToCompound(compoundShape, bodyMesh);

	//Rotor:
	let rotorGeometry = new THREE.BoxBufferGeometry(0.2, 20, 1);
	let rotorMaterial = new THREE.MeshBasicMaterial({ color:0x00de88});
	let rotorMesh = new THREE.Mesh(rotorGeometry, rotorMaterial);
	rotorMesh.name = "rotor";
	rotorMesh.rotation.z = Math.PI / 2;
	rotorMesh.rotation.y = Math.PI / 5;
	rotorMesh.position.x = 0;
	rotorMesh.position.y = 5;
	rotorMesh.position.z = 0;
	rotorMesh.castShadow = true;
	helicopter.add(rotorMesh);
	createTriangleShapeAddToCompound(compoundShape, rotorMesh);

	//Bakrotor:
	let backrotorGeometry = new THREE.BoxBufferGeometry(5, 1, 0.2);
	let backrotorMaterial = new THREE.MeshBasicMaterial({ color:0x00de88});
	let backrotorMesh = new THREE.Mesh(backrotorGeometry, backrotorMaterial);
	backrotorMesh.name = "bakrotor";
	backrotorMesh.position.x = -13.0;
	backrotorMesh.position.y = 1;
	backrotorMesh.position.z = 0;
	helicopter.add(backrotorMesh);
	scene.add(helicopter);
	createTriangleShapeAddToCompound(compoundShape, backrotorMesh);

	// Sett samme transformasjon på compoundShape som på helicopter:
	let massHeli = 50000;
	setCompoundTransformationBasedOnMesh(scene, compoundShape, helicopter, massHeli);
}

// Her kan man bestemme om triangleShapen skal lages vha. btBvhTriangleMeshShape eller btConvexTriangleMeshShape
function createTriangleShapeAddToCompound(compoundShape, mesh) {
	let shape = createAmmoTriangleShape(mesh, true);
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

	physicsWorld.addRigidBody(rigidBodyCompound, colGroupTriangle, colGroupTriangle | colGroupPlane | colGroupBall | colGroupCompound | colGroupMoveable | colGroupConvex);
	physicsWorld.updateSingleAabb(rigidBodyCompound) ;
	mesh.userData.physicsBody = rigidBodyCompound;
	rigidBodies.push(mesh);
}

// Oppretter og returnerer en btBvhTriangleMeshShape ELLER btConvexTriangleMeshShape
// og skalerer shapen i forhold til meshet.
// MERK!
//   Rigid body-objekter basert på btBvhTriangleMeshShape kan ikke kollidere med hverandre.
//   Rigid body-objekter basert på btConvexTriangleMeshShape kan kollidere med hverandre, men har en konveks kollisjonsboks rundt seg.
//
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

// Traverserer modellen rekursivt. Henter ut alle vertekser fra alle Mesh-objekter som modellen består av.
export function traverseModel(mesh, modelVertices=[]) {
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
