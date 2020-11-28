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
export function createTriangleMeshShape(scene, triangleMesh, massTriangleMesh, scale, position) {
	if (!scale)
		scale = {x:1,y:1,z:1};
	if (!position)
		position = {x:0,y:20,z:0};

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
	compoundShapeTrans.setRotation( new Ammo.btQuaternion( 0,0,0,1 ) );
	let motionState = new Ammo.btDefaultMotionState( compoundShapeTrans );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	compoundShape.setMargin( 0.04 );
	compoundShape.calculateLocalInertia( massTriangleMesh, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( massTriangleMesh, motionState, compoundShape, localInertia );
	let rigidBodyCompound = new Ammo.btRigidBody(rbInfo);
	rigidBodyCompound.setFriction(0.4);
	rigidBodyCompound.setRestitution(0.6);

	let orientation = compoundShapeTrans.getRotation();
	triangleMesh.setRotationFromQuaternion(new THREE.Quaternion(orientation.x(), orientation.y(), orientation.z(), orientation.w()));
	triangleMesh.castShadow = true;
	triangleMesh.scale.x=scale.x;
	triangleMesh.scale.y=scale.y;
	triangleMesh.scale.z=scale.z;
	triangleMesh.receiveShadow = true;
	scene.add(triangleMesh);

	physicsWorld.addRigidBody(rigidBodyCompound, colGroupTriangle, colGroupTriangle | colGroupPlane | colGroupBall | colGroupCompound | colGroupMoveable | colGroupConvex);
	physicsWorld.updateSingleAabb(rigidBodyCompound) ;
	triangleMesh.userData.physicsBody = rigidBodyCompound;
	rigidBodies.push(triangleMesh);
}

// Oppretter og returnerer en btBvhTriangleMeshShape
// og skalerer shapen i forhold til meshet.
// MERK! Rigid body-objekter basert på btBvhTriangleMeshShape kan ikke kollidere med hverandre.
function createAmmoTriangleShape(mesh, scale) {
	if (!scale)
		scale = {x:1, y:1, z: 1};

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
	let triangleShape = new Ammo.btBvhTriangleMeshShape(ammoMesh, false);
	triangleShape.setMargin( 0.01 );
	triangleShape.setLocalScaling(new Ammo.btVector3(scale.x, scale.y, scale.z));
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
