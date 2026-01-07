# Blueprint3D Room Configurator

## Overview
A 3D room configurator application built with React.js, allowing users to design and visualize room layouts with furniture and fixtures. This is a pre-built static application.

## Project Architecture

### Structure
- `/` - Root contains pre-built static assets (index.html, favicon, manifests)
- `/static/` - Compiled CSS and JavaScript bundles
- `/Blueprint3D-assets/` - 3D model assets (GLB files) for furniture and room elements
- `/screenshots/` - Application screenshots
- `server.js` - Node.js static file server

### Technology Stack
- **Frontend**: React.js (pre-compiled)
- **3D Engine**: Three.js
- **Server**: Node.js static file server
- **Port**: 5000

## Running the Application
The application runs via a simple Node.js static server:
```bash
node server.js
```

This serves all static files on port 5000.

## Deployment
Configured as a static deployment serving the pre-built files.
