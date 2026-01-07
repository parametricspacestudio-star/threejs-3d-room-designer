import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as BUI from '@thatopen/ui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ArchitectureFragments } from './ArchitectureFragments';

BUI.Manager.init();

async function init() {
    console.log("Initializing Hybrid BIM Configurator...");
    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>();
    
    world.name = 'main';
    const sceneComponent = new OBC.SimpleScene(components);
    sceneComponent.setup();
    world.scene = sceneComponent;
    
    const arch = new ArchitectureFragments(components);
    const gltfLoader = new GLTFLoader();
    
    const container = document.getElementById('container')!;
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.zIndex = '0';
    
    const viewport = document.createElement('bim-viewport');
    viewport.style.width = '100%';
    viewport.style.height = '100%';
    viewport.style.display = 'block';
    container.appendChild(viewport);
    
    world.renderer = new OBC.SimpleRenderer(components, viewport);
    world.camera = new OBC.OrthoPerspectiveCamera(components);
    
    const fragments = components.get(OBC.FragmentsManager);
    fragments.init();
    components.init();

    const addFurniture = (modelPath: string) => {
        const fullPath = modelPath.startsWith('/') ? modelPath : `/${modelPath}`;
        console.log("Loading furniture from:", fullPath);
        
        gltfLoader.load(fullPath, (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0);
            world.scene.three.add(model);
            console.log("Furniture added successfully:", fullPath);
        }, (progress) => {
            if (progress.total > 0) {
                console.log(`Loading ${fullPath}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
            }
        }, (err) => {
            console.error("Furniture load error for:", fullPath, err);
        });
    };

    let currentSlab: THREE.Mesh | null = null;
    let slabWidth = 10;
    let slabDepth = 10;

    const createRoomModal = () => {
        const modal = BUI.Component.create<any>(() => {
            return BUI.html`
                <bim-modal label="Room Dimensions" icon="measurement">
                    <bim-panel style="padding: 1rem; gap: 1rem; display: flex; flex-direction: column;">
                        <bim-label>Enter slab dimensions (meters):</bim-label>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                             <bim-label>Width:</bim-label>
                             <input type="number" .value="${slabWidth.toString()}" @input="${(e: any) => slabWidth = Number(e.target.value)}" style="background: #333; color: white; border: 1px solid #555; padding: 4px; border-radius: 4px; width: 60px;">
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                             <bim-label>Depth:</bim-label>
                             <input type="number" .value="${slabDepth.toString()}" @input="${(e: any) => slabDepth = Number(e.target.value)}" style="background: #333; color: white; border: 1px solid #555; padding: 4px; border-radius: 4px; width: 60px;">
                        </div>
                        <bim-button label="Create Slab" @click=${() => {
                            if (currentSlab) world.scene.three.remove(currentSlab);
                            currentSlab = arch.createSlab(slabWidth, slabDepth, 0.2);
                            modal.active = false;
                        }}></bim-button>
                    </bim-panel>
                </bim-modal>
            `;
        });
        document.body.appendChild(modal);
        modal.active = true;
    };

    const placeWallOnEdge = (edge: 'north' | 'south' | 'east' | 'west') => {
        if (!currentSlab) return;
        
        const w = slabWidth / 2;
        const d = slabDepth / 2;
        let p1, p2;

        if (edge === 'north') { p1 = new THREE.Vector3(-w, 0, -d); p2 = new THREE.Vector3(w, 0, -d); }
        else if (edge === 'south') { p1 = new THREE.Vector3(-w, 0, d); p2 = new THREE.Vector3(w, 0, d); }
        else if (edge === 'east') { p1 = new THREE.Vector3(w, 0, -d); p2 = new THREE.Vector3(w, 0, d); }
        else { p1 = new THREE.Vector3(-w, 0, -d); p2 = new THREE.Vector3(-w, 0, d); }

        arch.createWall([p1, p2], 3, 0.2);
    };

    const mainLayout = BUI.Component.create<BUI.PanelSection>(() => {
        return BUI.html`
            <div style="position: fixed; inset: 0; pointer-events: none; z-index: 99999; display: flex; justify-content: space-between; padding: 2rem;">
                <div style="pointer-events: auto; width: 320px; display: flex; flex-direction: column; gap: 1rem; background: rgba(32, 33, 36, 0.9); padding: 1.5rem; border-radius: 12px; border: 1px solid #444; height: fit-content; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                    <h2 style="color: white; margin: 0 0 1rem 0; font-family: sans-serif; font-size: 1.4rem; border-bottom: 1px solid #555; padding-bottom: 0.5rem;">BIM Hub</h2>
                    <bim-panel label="Architecture" icon="gear" active expanded>
                        <bim-panel-section label="Slab & Walls" icon="wall" expanded>
                            <div style="display: flex; flex-direction: column; gap: 0.8rem; padding: 0.5rem;">
                                <bim-button label="Define Room Slab" @click=${createRoomModal}></bim-button>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
                                    <bim-button label="Wall N" @click=${() => placeWallOnEdge('north')}></bim-button>
                                    <bim-button label="Wall S" @click=${() => placeWallOnEdge('south')}></bim-button>
                                    <bim-button label="Wall E" @click=${() => placeWallOnEdge('east')}></bim-button>
                                    <bim-button label="Wall W" @click=${() => placeWallOnEdge('west')}></bim-button>
                                </div>
                            </div>
                        </bim-panel-section>
                        <bim-panel-section label="Furniture" icon="chair" expanded>
                            <div style="display: flex; flex-direction: column; gap: 0.8rem; padding: 0.5rem;">
                                <bim-button label="Add Chair" @click=${() => addFurniture('Blueprint3D-assets/models/glb/chair.glb')}></bim-button>
                                <bim-button label="Add Table" @click=${() => addFurniture('Blueprint3D-assets/models/glb/table.glb')}></bim-button>
                                <bim-button label="Add Bed" @click=${() => addFurniture('Blueprint3D-assets/models/glb/bedDouble.glb')}></bim-button>
                            </div>
                        </bim-panel-section>
                    </bim-panel>
                </div>
            </div>
        `;
    });

    if (mainLayout) document.body.appendChild(mainLayout);
    
    components.get(OBCF.Highlighter).setup({ world });
    components.get(OBC.Grids).create(world);
    
    await world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
    console.log("Hybrid BIM Configurator Ready.");
}

init().catch(err => console.error(err));