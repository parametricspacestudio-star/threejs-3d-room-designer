# Hybrid BIM Configurator

## Overview
A modern 3D room configurator that combines standard GLB furniture placement with architectural BIM data management using "That Open Company" components.

## Project Architecture

### Structure
- `/src/` - TypeScript source code
  - `main.ts` - Main entry point, scene orchestration, and OBC UI initialization.
  - `ArchitectureFragments.ts` - Management of BIM-compliant architectural geometry (Walls, Slabs).
- `/public/` - Static assets served by Vite
  - `Blueprint3D-assets/` - 3D model library (.glb).
- `vite.config.ts` - Optimized build pipeline for BIM components.

### Technology Stack
- **3D Engine**: Three.js & @thatopen/components
- **UI Framework**: @thatopen/ui (BUI)
- **BIM Core**: @thatopen/fragments
- **Build Tool**: Vite
- **Language**: TypeScript

## Features
- **Dynamic Slab Creation**: User-defined room dimensions via modal UI.
- **Variable Wall Height**: Define height for walls during placement.
- **BIM Property Inspector**: Select any element (wall, slab, furniture) to view its metadata.
- **Furniture Catalog**: Catalog of GLB models for interior configuration.

## Running the Application
```bash
npm run dev
```
The application will be available on port 5000.
