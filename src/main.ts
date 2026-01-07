import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as BUI from '@thatopen/ui';
import { ArchitectureFragments } from './ArchitectureFragments';

BUI.Manager.init();

async function init() {
    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>();
    
    world.name = 'main';
    const sceneComponent = new OBC.SimpleScene(components);
    sceneComponent.setup();
    world.scene = sceneComponent;
    
    // Create viewport container
    const container = document.getElementById('container')!;
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.background = '#202124';
    
    const viewport = document.createElement('bim-viewport');
    viewport.style.width = '100%';
    viewport.style.height = '100%';
    viewport.style.display = 'block';
    container.appendChild(viewport);
    
    world.renderer = new OBC.SimpleRenderer(components, viewport);
    world.camera = new OBC.OrthoPerspectiveCamera(components);
    
    components.init();
    
    // Initialize Managers
    const fragments = components.get(OBC.FragmentsManager);
    console.log("Fragments Manager ready", fragments);
    const arch = new ArchitectureFragments(components);
    
    // Setup Highlighter
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    
    // Grids
    const grids = components.get(OBC.Grids);
    grids.create(world);
    
    // Initial Camera
    await world.camera.controls.setLookAt(20, 20, 20, 0, 0, 0);
    
    console.log("Hybrid BIM Configurator Initialized");
    
    // Example: Create architecture from logic
    arch.createWall([new THREE.Vector3(-5,0,-5), new THREE.Vector3(5,0,-5)], 3, 0.2);

    return { world, components };
}

init().catch(err => console.error("Initialization error:", err));