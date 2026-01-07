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

## Running the Application
```bash
npm run dev
```
The application will be available on port 5000.

## Development Status
The application is in a hybrid state where BIM components are integrated into the Three.js viewport, and a professional HUD provides tools for architectural element creation.
