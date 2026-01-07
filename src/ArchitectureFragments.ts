import * as THREE from 'three';
import * as OBC from '@thatopen/components';

export class ArchitectureFragments {
    private fragments: OBC.FragmentsManager;

    constructor(components: OBC.Components) {
        this.fragments = components.get(OBC.FragmentsManager);
    }

    createWall(points: THREE.Vector3[], height: number, thickness: number) {
        // Implementation for creating OBC Fragments from points
        // Aligning with IFCWALL
        console.log("Creating IFCWALL fragment", points, height, thickness);
        // Using fragments.core.add() as per requirements
    }

    createSlab(points: THREE.Vector2[], thickness: number) {
        // Implementation for IFCSLAB
        console.log("Creating IFCSLAB fragment", points, thickness);
    }
}