/*
	Et "vippbart" terreng/plan.
 */
import * as THREE from "../../lib/three/build/three.module.js";

let physicsWorld;
let tmpTrans;
let colGroupPlane = 1, colGroupBall = 2, colGroupTriangle = 4;
let rigidBodies = [];
let terrainRigidBody;
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

// Flatt terreng/plan (uten hull e.l.). Bruk f.eks. Shape og ExtrudeBuffferGeometry til dette.
// Må pakke terreng-shapen inn i en btCompoundShape for at planet skal vippe om sentrum.
// Lager derfor også en Three.Group som inneholder et mesh basert på BoxBufferGeometry.
export function createTiltableTerrain(scene){

	//Ammo-konteiner:
	let compoundShape = new Ammo.btCompoundShape();

	//Three-konteiner:
	let groupMesh = new THREE.Group();
	groupMesh.position.x = 0
	groupMesh.position.y = 0;
	groupMesh.position.z = 0;

	// Størrelser på "terrenget"/planet:
	let WIDTH=100, HEIGHT=2, DEPTH=100;
	let OBS_WIDTH = 4, OBS_HEIGHT = 4, OBS_DEPTH = 10;

	let options = {
		depth: HEIGHT,
		bevelThickness: 2,
		bevelSize: 0,
		bevelSegments: 1,
		bevelEnabled: true,
		curveSegments: 12,
		steps: 1
	}

	// THREE
	let boardGeometry = getBoardShape();
	let extrudeGeometry = new THREE.ExtrudeBufferGeometry(boardGeometry, options);
	let extrudeMaterial = new THREE.MeshPhongMaterial({ color: 0x0FE70E, side: THREE.DoubleSide });
	let extrudeMesh = new THREE.Mesh(extrudeGeometry, extrudeMaterial);
	extrudeMesh.position.set(-WIDTH/2, 0, -WIDTH/2);
	extrudeMesh.rotation.x = Math.PI / 2;
	extrudeMesh.scale.set(1,1,1,);
	extrudeMesh.receiveShadow = true;
	groupMesh.add(extrudeMesh);

	let mazePart1Geometry = new THREE.BoxBufferGeometry( OBS_WIDTH, OBS_HEIGHT,OBS_DEPTH * 3, 5, 5);
	let mazePart1Material = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazePart1Mesh = new THREE.Mesh( mazePart1Geometry, mazePart1Material );
	mazePart1Mesh.position.set(-5, 4, 5);
	mazePart1Mesh.scale.set(1,1,1,);
	mazePart1Mesh.receiveShadow = true;
	groupMesh.add( mazePart1Mesh );

	let mazePart2Geometry = new THREE.BoxBufferGeometry( OBS_WIDTH, OBS_HEIGHT,OBS_DEPTH, 5, 5);
	let mazePart2Material = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazePart2Mesh = new THREE.Mesh( mazePart2Geometry, mazePart2Material );
	mazePart2Mesh.position.set(20, 4, -30);
	mazePart2Mesh.scale.set(1,1,1,);
	mazePart2Mesh.receiveShadow = true;
	groupMesh.add( mazePart2Mesh );

	let mazePart3Geometry = new THREE.BoxBufferGeometry( OBS_WIDTH, OBS_HEIGHT,OBS_DEPTH * 3.5, 5, 5);
	let mazePart3Material = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazePart3Mesh = new THREE.Mesh( mazePart3Geometry, mazePart3Material );
	mazePart3Mesh.position.set(30, 4, 15);
	mazePart3Mesh.scale.set(1,1,1,);
	mazePart3Mesh.receiveShadow = true;
	groupMesh.add( mazePart3Mesh );

	let mazePart4Geometry = new THREE.BoxBufferGeometry( OBS_WIDTH, OBS_HEIGHT,OBS_DEPTH * 2, 5, 5);
	let mazePart4Material = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazePart4Mesh = new THREE.Mesh( mazePart4Geometry, mazePart4Material );
	mazePart4Mesh.position.set(-30, 4, -40);
	mazePart4Mesh.scale.set(1,1,1,);
	mazePart4Mesh.receiveShadow = true;
	groupMesh.add( mazePart4Mesh );

	let mazePart5Geometry = new THREE.BoxBufferGeometry( OBS_WIDTH, OBS_HEIGHT,OBS_DEPTH * 2, 5, 5);
	let mazePart5Material = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazePart5Mesh = new THREE.Mesh( mazePart5Geometry, mazePart5Material );
	mazePart5Mesh.position.set(-40, 4, -0);
	mazePart5Mesh.rotation.y = Math.PI / 2
	mazePart5Mesh.scale.set(1,1,1,);
	mazePart5Mesh.receiveShadow = true;
	groupMesh.add( mazePart5Mesh );

	let mazePart6Geometry = new THREE.BoxBufferGeometry( OBS_WIDTH, OBS_HEIGHT,OBS_DEPTH * 2, 5, 5);
	let mazePart6Material = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazePart6Mesh = new THREE.Mesh( mazePart6Geometry, mazePart6Material );
	mazePart6Mesh.position.set(7, 4, -8);
	mazePart6Mesh.rotation.y = Math.PI / 2
	mazePart6Mesh.scale.set(1,1,1,);
	mazePart6Mesh.receiveShadow = true;
	groupMesh.add( mazePart6Mesh );

	let mazePart7Geometry = new THREE.BoxBufferGeometry( OBS_WIDTH, OBS_HEIGHT,OBS_DEPTH * 2, 5, 5);
	let mazePart7Material = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazePart7Mesh = new THREE.Mesh( mazePart7Geometry, mazePart7Material );
	mazePart7Mesh.position.set(-30, 4, 40);
	mazePart7Mesh.scale.set(1,1,1,);
	mazePart7Mesh.receiveShadow = true;
	groupMesh.add( mazePart7Mesh );

	let mazeNWallGeometry = new THREE.BoxBufferGeometry( WIDTH, 5, 2, 1, 1);
	let mazeNWallMaterial = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazeNWallMesh = new THREE.Mesh( mazeNWallGeometry, mazeNWallMaterial );
	mazeNWallMesh.position.set(0, 4, -51);
	mazeNWallMesh.scale.set(1,1,1,);
	mazeNWallMesh.receiveShadow = true;
	groupMesh.add( mazeNWallMesh );

	let mazeSWallGeometry = new THREE.BoxBufferGeometry( WIDTH, 5, 2, 1, 1);
	let mazeSWallMaterial = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazeSWallMesh = new THREE.Mesh( mazeSWallGeometry, mazeSWallMaterial );
	mazeSWallMesh.position.set(0, 4, 51);
	mazeSWallMesh.scale.set(1,1,1,);
	mazeSWallMesh.receiveShadow = true;
	groupMesh.add( mazeSWallMesh );

	let mazeWWallGeometry = new THREE.BoxBufferGeometry( WIDTH + 4, 5, 2, 1, 1);
	let mazeWWallMaterial = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazeWWallMesh = new THREE.Mesh( mazeWWallGeometry, mazeWWallMaterial );
	mazeWWallMesh.position.set(-51, 4, 0);
	mazeWWallMesh.rotation.y = Math.PI / 2;
	mazeWWallMesh.scale.set(1,1,1,);
	mazeWWallMesh.receiveShadow = true;
	groupMesh.add( mazeWWallMesh );

	let mazeEWallGeometry = new THREE.BoxBufferGeometry( WIDTH + 4, 5, 2, 1, 1);
	let mazeEWallMaterial = new THREE.MeshPhongMaterial( { color: 0x0FE70E, side: THREE.DoubleSide } );
	let mazeEWallMesh = new THREE.Mesh( mazeEWallGeometry, mazeEWallMaterial );
	mazeEWallMesh.position.set(51, 4, 0);
	mazeEWallMesh.rotation.y = Math.PI / 2;
	mazeEWallMesh.scale.set(1,1,1,);
	mazeEWallMesh.receiveShadow = true;
	groupMesh.add( mazeEWallMesh );

	// AMMO
	let ammoExtrudeShape = createAmmoTriangleShape(extrudeMesh, false);
	let shapeTrans = new Ammo.btTransform();
	shapeTrans.setIdentity();
	shapeTrans.setOrigin(new Ammo.btVector3(extrudeMesh.position.x,extrudeMesh.position.y,extrudeMesh.position.z));
	let ammoExtrudeShapeQuat = extrudeMesh.quaternion;
	shapeTrans.setRotation( new Ammo.btQuaternion(ammoExtrudeShapeQuat.x, ammoExtrudeShapeQuat.y, ammoExtrudeShapeQuat.z, ammoExtrudeShapeQuat.w) );
	compoundShape.addChildShape(shapeTrans, ammoExtrudeShape);

	let ammoMazePart1Shape = new Ammo.btBoxShape(new Ammo.btVector3(OBS_WIDTH/2, OBS_HEIGHT/2, (OBS_DEPTH * 3)/2));
	let mazePart1ShapeTrans = new Ammo.btTransform();
	mazePart1ShapeTrans.setIdentity();
	mazePart1ShapeTrans.setOrigin(new Ammo.btVector3(mazePart1Mesh.position.x,mazePart1Mesh.position.y,mazePart1Mesh.position.z));
	let mazePart1Quat = mazePart1Mesh.quaternion;
	mazePart1ShapeTrans.setRotation( new Ammo.btQuaternion(mazePart1Quat.x, mazePart1Quat.y, mazePart1Quat.z, mazePart1Quat.w) );
	compoundShape.addChildShape(mazePart1ShapeTrans, ammoMazePart1Shape);

	let ammoMazePart2Shape = new Ammo.btBoxShape(new Ammo.btVector3(OBS_WIDTH/2, OBS_HEIGHT/2, OBS_DEPTH/2));
	let mazePart2ShapeTrans = new Ammo.btTransform();
	mazePart2ShapeTrans.setIdentity();
	mazePart2ShapeTrans.setOrigin(new Ammo.btVector3(mazePart2Mesh.position.x,mazePart2Mesh.position.y,mazePart2Mesh.position.z));
	let mazePart2Quat = mazePart2Mesh.quaternion;
	mazePart2ShapeTrans.setRotation( new Ammo.btQuaternion(mazePart2Quat.x, mazePart2Quat.y, mazePart2Quat.z, mazePart2Quat.w) );
	compoundShape.addChildShape(mazePart2ShapeTrans, ammoMazePart2Shape);

	let ammoMazePart3Shape = new Ammo.btBoxShape(new Ammo.btVector3(OBS_WIDTH/2, OBS_HEIGHT/2, (OBS_DEPTH * 3.5)/2));
	let mazePart3ShapeTrans = new Ammo.btTransform();
	mazePart3ShapeTrans.setIdentity();
	mazePart3ShapeTrans.setOrigin(new Ammo.btVector3(mazePart3Mesh.position.x,mazePart3Mesh.position.y,mazePart3Mesh.position.z));
	let mazePart3Quat = mazePart3Mesh.quaternion;
	mazePart3ShapeTrans.setRotation( new Ammo.btQuaternion(mazePart3Quat.x, mazePart3Quat.y, mazePart3Quat.z, mazePart3Quat.w) );
	compoundShape.addChildShape(mazePart3ShapeTrans, ammoMazePart3Shape);

	let ammoMazePart4Shape = new Ammo.btBoxShape(new Ammo.btVector3(OBS_WIDTH/2, OBS_HEIGHT/2, (OBS_DEPTH*2)/2));
	let mazePart4ShapeTrans = new Ammo.btTransform();
	mazePart4ShapeTrans.setIdentity();
	mazePart4ShapeTrans.setOrigin(new Ammo.btVector3(mazePart4Mesh.position.x,mazePart4Mesh.position.y,mazePart4Mesh.position.z));
	let mazePart4Quat = mazePart4Mesh.quaternion;
	mazePart4ShapeTrans.setRotation( new Ammo.btQuaternion(mazePart4Quat.x, mazePart4Quat.y, mazePart4Quat.z, mazePart4Quat.w) );
	compoundShape.addChildShape(mazePart4ShapeTrans, ammoMazePart4Shape);

	let ammoMazePart5Shape = new Ammo.btBoxShape(new Ammo.btVector3(OBS_WIDTH/2, OBS_HEIGHT/2, (OBS_DEPTH*2)/2));
	let mazePart5ShapeTrans = new Ammo.btTransform();
	mazePart5ShapeTrans.setIdentity();
	mazePart5ShapeTrans.setOrigin(new Ammo.btVector3(mazePart5Mesh.position.x,mazePart5Mesh.position.y,mazePart5Mesh.position.z));
	let mazePart5Quat = mazePart5Mesh.quaternion;
	mazePart5ShapeTrans.setRotation( new Ammo.btQuaternion(mazePart5Quat.x, mazePart5Quat.y, mazePart5Quat.z, mazePart5Quat.w) );
	compoundShape.addChildShape(mazePart5ShapeTrans, ammoMazePart5Shape);

	let ammoMazePart6Shape = new Ammo.btBoxShape(new Ammo.btVector3(OBS_WIDTH/2, OBS_HEIGHT/2, (OBS_DEPTH*2)/2));
	let mazePart6ShapeTrans = new Ammo.btTransform();
	mazePart6ShapeTrans.setIdentity();
	mazePart6ShapeTrans.setOrigin(new Ammo.btVector3(mazePart6Mesh.position.x,mazePart6Mesh.position.y,mazePart6Mesh.position.z));
	let mazePart6Quat = mazePart6Mesh.quaternion;
	mazePart6ShapeTrans.setRotation( new Ammo.btQuaternion(mazePart6Quat.x, mazePart6Quat.y, mazePart6Quat.z, mazePart6Quat.w) );
	compoundShape.addChildShape(mazePart6ShapeTrans, ammoMazePart6Shape);

	let ammoMazePart7Shape = new Ammo.btBoxShape(new Ammo.btVector3(OBS_WIDTH/2, OBS_HEIGHT/2, (OBS_DEPTH*2)/2));
	let mazePart7ShapeTrans = new Ammo.btTransform();
	mazePart7ShapeTrans.setIdentity();
	mazePart7ShapeTrans.setOrigin(new Ammo.btVector3(mazePart7Mesh.position.x,mazePart7Mesh.position.y,mazePart7Mesh.position.z));
	let mazePart7Quat = mazePart7Mesh.quaternion;
	mazePart7ShapeTrans.setRotation( new Ammo.btQuaternion(mazePart7Quat.x, mazePart7Quat.y, mazePart7Quat.z, mazePart7Quat.w) );
	compoundShape.addChildShape(mazePart7ShapeTrans, ammoMazePart7Shape);


	let ammoMazeNWallShape = new Ammo.btBoxShape(new Ammo.btVector3((WIDTH + 4)/2, 5/2, 2/2));
	let mazeNWallShapeTrans = new Ammo.btTransform();
	mazeNWallShapeTrans.setIdentity();
	mazeNWallShapeTrans.setOrigin(new Ammo.btVector3(mazeNWallMesh.position.x,mazeNWallMesh.position.y,mazeNWallMesh.position.z));
	let mazeNWallQuat = mazeNWallMesh.quaternion;
	mazeNWallShapeTrans.setRotation( new Ammo.btQuaternion(mazeNWallQuat.x, mazeNWallQuat.y, mazeNWallQuat.z, mazeNWallQuat.w) );
	compoundShape.addChildShape(mazeNWallShapeTrans, ammoMazeNWallShape);

	let ammoMazeSWallShape = new Ammo.btBoxShape(new Ammo.btVector3((WIDTH + 4)/2, 5/2, 2/2));
	let mazeSWallShapeTrans = new Ammo.btTransform();
	mazeSWallShapeTrans.setIdentity();
	mazeSWallShapeTrans.setOrigin(new Ammo.btVector3(mazeSWallMesh.position.x,mazeSWallMesh.position.y,mazeSWallMesh.position.z));
	let mazeSWallQuat = mazeSWallMesh.quaternion;
	mazeSWallShapeTrans.setRotation( new Ammo.btQuaternion(mazeSWallQuat.x, mazeSWallQuat.y, mazeSWallQuat.z, mazeSWallQuat.w) );
	compoundShape.addChildShape(mazeSWallShapeTrans, ammoMazeSWallShape);

	let ammoMazeWWallShape = new Ammo.btBoxShape(new Ammo.btVector3((WIDTH + 4)/2, 5/2, 2/2));
	let mazeWWallShapeTrans = new Ammo.btTransform();
	mazeWWallShapeTrans.setIdentity();
	mazeWWallShapeTrans.setOrigin(new Ammo.btVector3(mazeWWallMesh.position.x,mazeWWallMesh.position.y,mazeWWallMesh.position.z));
	let mazeWWallQuat = mazeWWallMesh.quaternion;
	mazeWWallShapeTrans.setRotation( new Ammo.btQuaternion(mazeWWallQuat.x, mazeWWallQuat.y, mazeWWallQuat.z, mazeWWallQuat.w) );
	compoundShape.addChildShape(mazeWWallShapeTrans, ammoMazeWWallShape);

	let ammoMazeEWallShape = new Ammo.btBoxShape(new Ammo.btVector3((WIDTH + 4)/2, 5/2, 2/2));
	let mazeEWallShapeTrans = new Ammo.btTransform();
	mazeEWallShapeTrans.setIdentity();
	mazeEWallShapeTrans.setOrigin(new Ammo.btVector3(mazeEWallMesh.position.x,mazeEWallMesh.position.y,mazeEWallMesh.position.z));
	let mazeEWallQuat = mazeEWallMesh.quaternion;
	mazeEWallShapeTrans.setRotation( new Ammo.btQuaternion(mazeEWallQuat.x, mazeEWallQuat.y, mazeEWallQuat.z, mazeEWallQuat.w) );
	compoundShape.addChildShape(mazeEWallShapeTrans, ammoMazeEWallShape);

	// Ammo compoundShape, transformasjon & rigidBody:
	let massTerrain = 0;
	let compoundShapeTrans = new Ammo.btTransform();
	compoundShapeTrans.setIdentity();
	compoundShapeTrans.setOrigin(new Ammo.btVector3(groupMesh.position.x,groupMesh.position.y,groupMesh.position.z));
	let quatCompound = groupMesh.quaternion;
	compoundShapeTrans.setRotation( new Ammo.btQuaternion( quatCompound.x, quatCompound.y, quatCompound.z, quatCompound.w ) );
	let motionState = new Ammo.btDefaultMotionState( compoundShapeTrans );
	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	compoundShape.setLocalScaling(new Ammo.btVector3(groupMesh.scale.x,groupMesh.scale.y, groupMesh.scale.x));
	compoundShape.calculateLocalInertia( massTerrain, localInertia );
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( massTerrain, motionState, compoundShape, localInertia );
	terrainRigidBody = new Ammo.btRigidBody(rbInfo);
	terrainRigidBody.setFriction(0.3);
	terrainRigidBody.setRestitution(0.03);
	terrainRigidBody.setCollisionFlags(terrainRigidBody.getCollisionFlags() | 2);   // BODYFLAG_KINEMATIC_OBJECT = 2 betyr kinematic object, masse=0 men kan flyttes!!
	terrainRigidBody.setActivationState(4);   // Never sleep, BODYSTATE_DISABLE_DEACTIVATION = 4
	scene.add(groupMesh);

	// Legg til physicsWorld:
	physicsWorld.addRigidBody( terrainRigidBody, colGroupPlane,  colGroupBall | colGroupTriangle);
	physicsWorld.updateSingleAabb(terrainRigidBody) ;
	groupMesh.userData.physicsBody = terrainRigidBody;
	rigidBodies.push(groupMesh);
}

function getBoardShape() {
	let boardShape = new THREE.Shape();

	let WIDTH=100;

	boardShape.moveTo(0, 0);
	boardShape.lineTo(0, WIDTH);
	boardShape.lineTo(WIDTH, WIDTH);
	boardShape.lineTo(WIDTH, 0);
	boardShape.lineTo(0,0);

	let hole1 = new THREE.Path();
	hole1.absarc(10,10, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole1);

	let hole2 = new THREE.Path();
	hole2.absarc(60,10, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole2);

	let hole3 = new THREE.Path();
	hole3.absarc(90,10, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole3);

	let hole4 = new THREE.Path();
	hole4.absarc(25,30, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole4);

	let hole5 = new THREE.Path();
	hole5.absarc(60,60, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole5);

	let hole6 = new THREE.Path();
	hole6.absarc(40,80, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole6);

	let hole7 = new THREE.Path();
	hole7.absarc(80,30, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole7);

	let hole8 = new THREE.Path();
	hole8.absarc(10,90, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole8);

	let hole9 = new THREE.Path();
	hole9.absarc(25,60, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole9);

	let hole10 = new THREE.Path();
	hole10.absarc(90,90, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole10);

	let hole11 = new THREE.Path();
	hole11.absarc(70,80, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole11);

	let hole12 = new THREE.Path();
	hole12.absarc(50,30, 5, 0, 2 * Math.PI, true);
	boardShape.holes.push(hole12);

	return boardShape;
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

export function createBall(scene, pos, color, mass){
	let radius = 3;
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
	physicsWorld.addRigidBody( sphereRigidBody, colGroupBall, colGroupBall | colGroupPlane | colGroupTriangle);

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

function toRadians(angle) {
	return Math.PI/180 * angle;
}

// axisNo: 1=x, 2=y, 3=z
export function tiltGameBoard(axisNo, angle) {
	let axis;
	switch (axisNo) {
		case 1:
			axis = new THREE.Vector3( 1, 0, 0 );
			break;
		case 2:
			axis = new THREE.Vector3( 0,1, 0);
			break;
		case 3:
			axis = new THREE.Vector3( 0,0, 1);
			break;
		default:
			axis = new THREE.Vector3( 1, 0, 0 );
	}
	// Henter gjeldende transformasjon:
	let terrainTransform = new Ammo.btTransform();
	let terrainMotionState = terrainRigidBody.getMotionState();
	terrainMotionState.getWorldTransform( terrainTransform );
	let ammoRotation = terrainTransform.getRotation();

	// Roter gameBoardRigidBody om en av aksene (bruker Three.Quaternion til dette):
	let threeCurrentQuat = new THREE.Quaternion(ammoRotation.x(), ammoRotation.y(), ammoRotation.z(), ammoRotation.w());
	let threeNewQuat = new THREE.Quaternion();
	threeNewQuat.setFromAxisAngle(axis, toRadians(angle));
	// Slår sammen eksisterende rotasjon med ny/tillegg.
	let resultQuaternion = threeCurrentQuat.multiply(threeNewQuat);
	// Setter ny rotasjon på ammo-objektet:
	terrainTransform.setRotation( new Ammo.btQuaternion( resultQuaternion.x, resultQuaternion.y, resultQuaternion.z, resultQuaternion.w ) );
	terrainMotionState.setWorldTransform(terrainTransform);
}
