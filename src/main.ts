import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as BUI from '@thatopen/ui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
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
    
    world.scene.three.background = new THREE.Color(0xffffff);
    
    const arch = new ArchitectureFragments(components);
    const gltfLoader = new GLTFLoader();
    
    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    world.scene.three.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(10, 20, 10);
    world.scene.three.add(sunLight);

    const container = document.getElementById('container')!;
    
    const viewport = document.createElement('bim-viewport');
    viewport.style.background = '#ffffff';
    container.appendChild(viewport);
    
    world.renderer = new OBC.SimpleRenderer(components, viewport);
    world.camera = new OBC.OrthoPerspectiveCamera(components);
    
    // Set initial size and handle resizing
    const resize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (world.renderer) {
            world.renderer.three.setSize(width, height);
        }
        if (world.camera) {
            const camera = world.camera.three as THREE.PerspectiveCamera;
            if (camera.isPerspectiveCamera) {
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            }
        }
    };
    resize();
    window.addEventListener('resize', resize);
    
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    highlighter.enabled = true;

    components.init();

    // Transform Controls
    if (!world.renderer || !world.camera) {
        throw new Error("World renderer or camera not initialized");
    }
    const transformControls = new TransformControls(world.camera.three, world.renderer.three.domElement);
    world.scene.three.add(transformControls.getHelper());
    
    transformControls.addEventListener('dragging-changed', (event) => {
        world.camera.controls.enabled = !event.value;
        if (!event.value && selectedObject) {
            // Update userData after drag
            selectedObject.userData.posX = Number(selectedObject.position.x.toFixed(2));
            selectedObject.userData.posZ = Number(selectedObject.position.z.toFixed(2));
            updateInspector(selectedObject);
        }
    });

    let slabWidth = 6;
    let slabDepth = 6;
    let wallHeight = 2.8;
    let currentSlab: THREE.Mesh | null = null;
    let selectedObject: THREE.Object3D | null = null;
    let highlightMesh: THREE.Mesh | null = null;

    const propertyPanel = document.createElement('div');
    propertyPanel.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #ddd;
        font-family: sans-serif;
        min-width: 260px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        pointer-events: auto;
    `;

    const clearHighlight = () => {
        if (highlightMesh) {
            world.scene.three.remove(highlightMesh);
            highlightMesh.geometry.dispose();
            (highlightMesh.material as THREE.Material).dispose();
            highlightMesh = null;
        }
        transformControls.detach();
    };

    const applyHighlight = (obj: THREE.Object3D) => {
        clearHighlight();
        if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Group)) return;
        
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const geo = new THREE.BoxGeometry(size.x + 0.05, size.y + 0.05, size.z + 0.05);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x007bff,
            transparent: true,
            opacity: 0.3,
            depthTest: false
        });
        
        highlightMesh = new THREE.Mesh(geo, mat);
        highlightMesh.position.copy(center);
        world.scene.three.add(highlightMesh);
        
        transformControls.attach(obj);
    };

    const zoomToObject = (obj: THREE.Object3D) => {
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        const cameraPos = new THREE.Vector3().copy(center).add(new THREE.Vector3(maxDim * 2, maxDim * 2, maxDim * 2));
        world.camera.controls.setLookAt(cameraPos.x, cameraPos.y, cameraPos.z, center.x, center.y, center.z, true);
    };

    const updateInspector = (obj: THREE.Object3D) => {
        selectedObject = obj;
        const data = obj.userData;
        
        propertyPanel.textContent = '';
        
        const header = document.createElement('h3');
        header.style.cssText = 'margin-top:0; border-bottom: 2px solid #eee; padding-bottom: 0.8rem; color: #1a1b1e;';
        header.textContent = 'Property Editor';
        propertyPanel.appendChild(header);
        
        for (const [key, value] of Object.entries(data)) {
            if (key === 'id') {
                const idDiv = document.createElement('div');
                idDiv.style.cssText = 'margin: 0.8rem 0; font-size: 0.75rem; color: #888;';
                idDiv.textContent = `ID: ${value}`;
                propertyPanel.appendChild(idDiv);
                continue;
            }
            
            const isNumber = typeof value === 'number';
            const container = document.createElement('div');
            container.style.cssText = 'margin: 0.8rem 0; display: flex; flex-direction: column; gap: 0.3rem;';
            
            const label = document.createElement('label');
            label.style.cssText = 'color: #666; font-size: 0.85rem;';
            label.textContent = `${key}:`;
            
            const input = document.createElement('input');
            input.type = isNumber ? 'number' : 'text';
            input.value = String(value);
            input.setAttribute('data-key', key);
            input.style.cssText = 'background: #f8f9fa; border: 1px solid #ced4da; padding: 6px; border-radius: 4px; outline: none;';
            input.className = 'prop-input';
            
            container.appendChild(label);
            container.appendChild(input);
            propertyPanel.appendChild(container);
        }

        const colorContainer = document.createElement('div');
        colorContainer.style.cssText = 'margin: 0.8rem 0; display: flex; flex-direction: column; gap: 0.3rem;';
        const colorLabel = document.createElement('label');
        colorLabel.style.cssText = 'color: #666; font-size: 0.85rem;';
        colorLabel.textContent = 'Material Color:';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = 'material-color';
        colorInput.value = '#cccccc';
        colorInput.style.cssText = 'width: 100%; height: 30px; border: 1px solid #ced4da; border-radius: 4px; cursor: pointer;';
        colorContainer.appendChild(colorLabel);
        colorContainer.appendChild(colorInput);
        propertyPanel.appendChild(colorContainer);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'margin-top: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem;';
        
        const modeButtonsDiv = document.createElement('div');
        modeButtonsDiv.style.cssText = 'display: flex; gap: 0.5rem;';
        
        const translateBtn = document.createElement('button');
        translateBtn.id = 'mode-translate';
        translateBtn.style.cssText = 'flex: 1; padding: 8px; background: #eee; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';
        translateBtn.textContent = 'Move';
        
        const rotateBtn = document.createElement('button');
        rotateBtn.id = 'mode-rotate';
        rotateBtn.style.cssText = 'flex: 1; padding: 8px; background: #eee; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';
        rotateBtn.textContent = 'Rotate';
        
        modeButtonsDiv.appendChild(translateBtn);
        modeButtonsDiv.appendChild(rotateBtn);
        
        const applyBtn = document.createElement('button');
        applyBtn.id = 'apply-props';
        applyBtn.style.cssText = 'width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;';
        applyBtn.textContent = 'Save Changes';
        
        buttonContainer.appendChild(modeButtonsDiv);
        buttonContainer.appendChild(applyBtn);
        propertyPanel.appendChild(buttonContainer);

        propertyPanel.querySelector('#mode-translate')?.addEventListener('click', () => transformControls.setMode('translate'));
        propertyPanel.querySelector('#mode-rotate')?.addEventListener('click', () => transformControls.setMode('rotate'));
        
        propertyPanel.querySelector('#material-color')?.addEventListener('input', (e: any) => {
            const color = e.target.value;
            obj.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    (child.material as THREE.MeshStandardMaterial).color.set(color);
                }
            });
        });

        const btn = propertyPanel.querySelector('#apply-props');
        if (btn) {
            btn.addEventListener('click', () => {
                const inputs = propertyPanel.querySelectorAll('.prop-input');
                inputs.forEach((input: any) => {
                    const k = input.getAttribute('data-key');
                    const val = input.type === 'number' ? Number(input.value) : input.value;
                    obj.userData[k] = val;
                    
                    if (obj instanceof THREE.Mesh) {
                        const d = obj.userData;
                        if (d.type === 'Wall') {
                            const newGeo = new THREE.BoxGeometry(d.length || 1, d.height || 2.5, d.thickness || 0.15);
                            obj.geometry.dispose();
                            obj.geometry = newGeo;
                            obj.position.y = (d.height || 2.5) / 2;
                        } else if (d.type === 'Slab') {
                            const newGeo = new THREE.BoxGeometry(d.width || 5, d.thickness || 0.2, d.depth || 5);
                            obj.geometry.dispose();
                            obj.geometry = newGeo;
                            obj.position.y = -(d.thickness || 0.2) / 2;
                        } else if (d.type === 'Furniture') {
                            if (k === 'posX') obj.position.x = val;
                            if (k === 'posZ') obj.position.z = val;
                        }
                    }
                });
            });
        }
    };

    const addFurniture = (modelName: string) => {
        const specialPath = `/Blueprint3D-assets/models/glb/special/${modelName}`;
        gltfLoader.load(specialPath, (gltf) => {
            const model = gltf.scene;
            model.userData = { 
                type: 'Furniture', 
                name: modelName.replace('.glb', ''), 
                id: THREE.MathUtils.generateUUID(),
                posX: 0,
                posZ: 0
            };
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.userData = model.userData;
                    child.material = (child.material as THREE.Material).clone();
                }
            });
            world.scene.three.add(model);
            updateInspector(model);
            applyHighlight(model);
        }, undefined, () => {
            const fallbackPath = `/Blueprint3D-assets/models/glb/${modelName}`;
            gltfLoader.load(fallbackPath, (gltf) => {
                const model = gltf.scene;
                model.userData = { 
                    type: 'Furniture', 
                    name: modelName.replace('.glb', ''), 
                    id: THREE.MathUtils.generateUUID(),
                    posX: 0,
                    posZ: 0
                };
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.userData = model.userData;
                        child.material = (child.material as THREE.Material).clone();
                    }
                });
                world.scene.three.add(model);
                updateInspector(model);
                applyHighlight(model);
            });
        });
    };

    const fitToView = () => {
        const box = new THREE.Box3().setFromObject(world.scene.three);
        if (box.isEmpty()) return;
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        world.camera.controls.setLookAt(center.x + maxDim, center.y + maxDim, center.z + maxDim, center.x, center.y, center.z, true);
    };

    const unselectAll = () => {
        selectedObject = null;
        clearHighlight();
        propertyPanel.innerHTML = '<h3 style="margin-top:0; border-bottom: 1px solid #eee; padding-bottom: 0.8rem; color: #1a1b1e;">Property Editor</h3><p style="color:#888;">Select an element to view properties.</p>';
    };

    const createRoomModal = () => {
        const modal = BUI.Component.create<any>(() => {
            return BUI.html`
                <bim-modal label="Room Configuration" icon="measurement">
                    <bim-panel style="padding: 1.5rem; gap: 1.2rem; display: flex; flex-direction: column; background: #fff; min-width: 320px;">
                        <bim-label style="color: #333; font-size: 1.1rem; font-weight: bold;">Initial Room Setup</bim-label>
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <bim-label style="color: #666;">Width (X):</bim-label>
                                <input type="number" .value="${slabWidth.toString()}" @input="${(e: any) => slabWidth = Number(e.target.value)}" style="background: #f8f9fa; border: 1px solid #ddd; padding: 8px; border-radius: 4px;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <bim-label style="color: #666;">Depth (Y):</bim-label>
                                <input type="number" .value="${slabDepth.toString()}" @input="${(e: any) => slabDepth = Number(e.target.value)}" style="background: #f8f9fa; border: 1px solid #ddd; padding: 8px; border-radius: 4px;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <bim-label style="color: #666;">Wall Height:</bim-label>
                                <input type="number" .value="${wallHeight.toString()}" @input="${(e: any) => wallHeight = Number(e.target.value)}" style="background: #f8f9fa; border: 1px solid #ddd; padding: 8px; border-radius: 4px;">
                            </div>
                        </div>
                        <bim-button label="Apply" style="width: 100%;" @click=${() => {
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

    const placeWallOnEdge = (edge: 'N' | 'S' | 'E' | 'W') => {
        if (!currentSlab) return;
        const w = slabWidth / 2;
        const d = slabDepth / 2;
        let p1, p2;
        if (edge === 'N') { p1 = new THREE.Vector3(-w, 0, -d); p2 = new THREE.Vector3(w, 0, -d); }
        else if (edge === 'S') { p1 = new THREE.Vector3(-w, 0, d); p2 = new THREE.Vector3(w, 0, d); }
        else if (edge === 'E') { p1 = new THREE.Vector3(w, 0, -d); p2 = new THREE.Vector3(w, 0, d); }
        else { p1 = new THREE.Vector3(-w, 0, -d); p2 = new THREE.Vector3(-w, 0, d); }
        arch.createWall([p1, p2], wallHeight, 0.15);
    };

    const mainLayout = BUI.Component.create<any>(() => {
        return BUI.html`
            <div style="position: fixed; inset: 0; pointer-events: none; z-index: 99999; display: flex; justify-content: space-between; padding: 1.5rem;">
                <div style="pointer-events: auto; width: 340px; display: flex; flex-direction: column; gap: 1rem; background: rgba(255, 255, 255, 0.95); padding: 1.5rem; border-radius: 12px; border: 1px solid #ddd; height: fit-content; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                    <h2 style="color: #1a1b1e; margin: 0 0 1rem 0; font-family: sans-serif; font-size: 1.4rem; border-bottom: 2px solid #007bff; padding-bottom: 0.6rem;">BIM Configurator</h2>
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <bim-button label="Fit View" icon="fullscreen" @click=${fitToView}></bim-button>
                        <bim-button label="Unselect All" icon="close" @click=${unselectAll}></bim-button>
                    </div>
                    <bim-panel label="Construction" active expanded>
                        <bim-panel-section label="Setup" expanded>
                            <div style="display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem;">
                                <bim-button label="1. Define Room" @click=${createRoomModal}></bim-button>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                                    <bim-button label="Wall N" @click=${() => placeWallOnEdge('N')}></bim-button>
                                    <bim-button label="Wall S" @click=${() => placeWallOnEdge('S')}></bim-button>
                                    <bim-button label="Wall E" @click=${() => placeWallOnEdge('E')}></bim-button>
                                    <bim-button label="Wall W" @click=${() => placeWallOnEdge('W')}></bim-button>
                                </div>
                            </div>
                        </bim-panel-section>
                        <bim-panel-section label="Library" expanded>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; padding: 0.5rem;">
                                <bim-button label="Chair" @click=${() => addFurniture('chair.glb')}></bim-button>
                                <bim-button label="Table" @click=${() => addFurniture('table.glb')}></bim-button>
                                <bim-button label="Sofa" @click=${() => addFurniture('loungeSofa.glb')}></bim-button>
                                <bim-button label="Bed" @click=${() => addFurniture('bedDouble.glb')}></bim-button>
                            </div>
                        </bim-panel-section>
                    </bim-panel>
                </div>
                <div id="inspector-container" style="pointer-events: auto; width: 300px; height: fit-content;"></div>
            </div>
        `;
    });

    if (mainLayout) {
        document.body.appendChild(mainLayout);
        document.getElementById('inspector-container')!.appendChild(propertyPanel);
    }
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    container.addEventListener('click', (event) => {
        if (transformControls.dragging) return;
        
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, world.camera.three);
        const intersects = raycaster.intersectObjects(world.scene.three.children, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && obj.parent !== world.scene.three && !obj.userData.type) {
                obj = obj.parent;
            }
            
            if (obj.userData.type) {
                if (selectedObject === obj) {
                    unselectAll();
                } else {
                    applyHighlight(obj);
                    updateInspector(obj);
                    zoomToObject(obj);
                }
            }
        }
    });

    components.get(OBC.Grids).create(world);
    await world.camera.controls.setLookAt(8, 8, 8, 0, 0, 0);
}

init().catch(err => console.error(err));