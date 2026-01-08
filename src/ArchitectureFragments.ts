import * as THREE from 'three';
import * as OBC from '@thatopen/components';

export class ArchitectureFragments {
    private components: OBC.Components;

    constructor(components: OBC.Components) {
        this.components = components;
    }

    createWall(points: THREE.Vector3[], height: number, thickness: number) {
        if (points.length < 2) return null;
        
        const start = points[0];
        const end = points[1];
        const length = start.distanceTo(end);
        
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        
        const geometry = new THREE.BoxGeometry(length, height, thickness);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { type: 'Wall', height: `${height}m`, thickness: `${thickness}m`, length: `${length.toFixed(2)}m` };
        
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mesh.position.set(center.x, height / 2, center.z);
        
        const angle = Math.atan2(-dir.z, dir.x);
        mesh.rotation.y = angle;

        const worlds = this.components.get(OBC.Worlds);
        const world = worlds.list.values().next().value;
        if (world && world.scene) {
            world.scene.three.add(mesh);
        }
        
        return mesh;
    }

    createSlab(width: number, depth: number, thickness: number) {
        const geometry = new THREE.BoxGeometry(width, thickness, depth);
        const material = new THREE.MeshStandardMaterial({ color: 0x404040 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { type: 'Slab', width: `${width}m`, depth: `${depth}m`, thickness: `${thickness}m` };
        
        // Ensure slab is placed correctly at origin
        mesh.position.set(0, -thickness / 2, 0);
        
        const worlds = this.components.get(OBC.Worlds);
        const world = worlds.list.values().next().value;
        if (world && world.scene) {
            world.scene.three.add(mesh);
        }
        
        return mesh;
    }
}