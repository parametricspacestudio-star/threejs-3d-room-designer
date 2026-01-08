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
        
        // Direction vector from start to end
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        
        // Wall Box Geometry: 
        // X = length (along the wall)
        // Y = height (vertical)
        // Z = thickness (depth of wall)
        const geometry = new THREE.BoxGeometry(length, height, thickness);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position: midpoint between p1 and p2, standing on the floor (Y=0)
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mesh.position.set(center.x, height / 2, center.z);
        
        // Orientation: rotate mesh around Y axis to align its X-axis with the wall direction
        // The angle between (1,0,0) and our direction vector on the XZ plane
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
        // Slab Box Geometry: X=width, Y=thickness, Z=depth
        const geometry = new THREE.BoxGeometry(width, thickness, depth);
        const material = new THREE.MeshStandardMaterial({ color: 0x404040 });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Center it horizontally, sit it slightly below floor level
        mesh.position.set(0, -thickness / 2, 0);
        
        const worlds = this.components.get(OBC.Worlds);
        const world = worlds.list.values().next().value;
        if (world && world.scene) {
            world.scene.three.add(mesh);
        }
        
        return mesh;
    }
}