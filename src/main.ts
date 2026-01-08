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

    const addFurniture = (modelName: string) => {
        // Furniture is located in /Blueprint3D-assets/models/glb/special/
        const fullPath = `/Blueprint3D-assets/models/glb/special/${modelName}`;
        console.log("Furniture Load Request:", fullPath);
        
        gltfLoader.load(fullPath, (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0);
            world.scene.three.add(model);
            console.log("Furniture displayed successfully.");
        }, (xhr) => {
            if (xhr.total > 0) console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        }, (error) => {
            console.error("Furniture display failed:", error);
            // Fallback for root models directory if special fails
            const fallbackPath = `/Blueprint3D-assets/models/glb/${modelName}`;
            gltfLoader.load(fallbackPath, (gltf) => {
                world.scene.three.add(gltf.scene);
                console.log("Furniture loaded from fallback.");
            });
        });
    };

    let slabWidth = 6;
    let slabDepth = 6;
    let currentSlab: THREE.Mesh | null = null;

    const createRoomModal = () => {
        const modal = BUI.Component.create<any>(() => {
            return BUI.html`
                <bim-modal label="Room Configuration" icon="measurement">
                    <bim-panel style="padding: 1.5rem; gap: 1.2rem; display: flex; flex-direction: column; background: #1a1b1e; min-width: 300px;">
                        <bim-label style="color: #fff; font-size: 1.1rem; font-weight: bold;">Define Room Dimensions</bim-label>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <bim-label style="color: #999;">Dimension X (M):</bim-label>
                                <input type="number" .value="${slabWidth.toString()}" @input="${(e: any) => slabWidth = Number(e.target.value)}" 
                                    style="background: #2a2b2e; color: #fff; border: 1px solid #444; padding: 8px; border-radius: 4px;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <bim-label style="color: #999;">Dimension Y (M):</bim-label>
                                <input type="number" .value="${slabDepth.toString()}" @input="${(e: any) => slabDepth = Number(e.target.value)}" 
                                    style="background: #2a2b2e; color: #fff; border: 1px solid #444; padding: 8px; border-radius: 4px;">
                            </div>
                        </div>

                        <div style="margin-top: 1rem;">
                            <bim-button label="Generate Room Slab" style="width: 100%;" @click=${() => {
                                if (currentSlab) world.scene.three.remove(currentSlab);
                                currentSlab = arch.createSlab(slabWidth, slabDepth, 0.2);
                                modal.active = false;
                            }}></bim-button>
                        </div>
                    </bim-panel>
                </bim-modal>
            `;
        });
        document.body.appendChild(modal);
        modal.active = true;
    };

    const placeWallOnEdge = (edge: 'N' | 'S' | 'E' | 'W') => {
        if (!currentSlab) {
            alert("Define slab dimensions first!");
            return;
        }
        const w = slabWidth / 2;
        const d = slabDepth / 2;
        let p1, p2;

        if (edge === 'N') { p1 = new THREE.Vector3(-w, 0, -d); p2 = new THREE.Vector3(w, 0, -d); }
        else if (edge === 'S') { p1 = new THREE.Vector3(-w, 0, d); p2 = new THREE.Vector3(w, 0, d); }
        else if (edge === 'E') { p1 = new THREE.Vector3(w, 0, -d); p2 = new THREE.Vector3(w, 0, d); }
        else { p1 = new THREE.Vector3(-w, 0, -d); p2 = new THREE.Vector3(-w, 0, d); }

        arch.createWall([p1, p2], 2.8, 0.15);
    };

    const mainLayout = BUI.Component.create<BUI.PanelSection>(() => {
        return BUI.html`
            <div style="position: fixed; inset: 0; pointer-events: none; z-index: 99999; display: flex; justify-content: space-between; padding: 1.5rem;">
                <div style="pointer-events: auto; width: 340px; display: flex; flex-direction: column; gap: 1rem; background: rgba(26, 27, 30, 0.98); padding: 1.5rem; border-radius: 12px; border: 1px solid #333; height: fit-content; box-shadow: 0 10px 40px rgba(0,0,0,0.7);">
                    <h2 style="color: #fff; margin: 0 0 1rem 0; font-family: sans-serif; font-size: 1.3rem; border-bottom: 2px solid #444; padding-bottom: 0.6rem;">BIM Hub v2</h2>
                    
                    <bim-panel label="Construction" active expanded>
                        <bim-panel-section label="Room Setup" icon="wall" expanded>
                            <div style="display: flex; flex-direction: column; gap: 1.2rem; padding: 0.5rem;">
                                <bim-button label="1. Set X/Y Dimensions" @click=${createRoomModal}></bim-button>
                                
                                <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                                    <bim-label style="color: #777; font-size: 0.8rem;">Add Walls to Edges:</bim-label>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                                        <bim-button label="Wall North" @click=${() => placeWallOnEdge('N')}></bim-button>
                                        <bim-button label="Wall South" @click=${() => placeWallOnEdge('S')}></bim-button>
                                        <bim-button label="Wall East" @click=${() => placeWallOnEdge('E')}></bim-button>
                                        <bim-button label="Wall West" @click=${() => placeWallOnEdge('W')}></bim-button>
                                    </div>
                                </div>
                            </div>
                        </bim-panel-section>

                        <bim-panel-section label="Furniture Library" icon="chair" expanded>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; padding: 0.5rem;">
                                <bim-button label="Chair" @click=${() => addFurniture('chair.glb')}></bim-button>
                                <bim-button label="Table" @click=${() => addFurniture('table.glb')}></bim-button>
                                <bim-button label="Sofa" @click=${() => addFurniture('loungeSofa.glb')}></bim-button>
                                <bim-button label="Bed" @click=${() => addFurniture('bedDouble.glb')}></bim-button>
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