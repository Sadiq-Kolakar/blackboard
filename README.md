# Infinite Canvas Notes App

A desktop application built with Electron, React, and Vite that provides an infinite whiteboard canvas for drawing, note-taking, and creative work.

## Features

- **Drawing Tools**
  - Freehand drawing with adjustable pen size and color
  - Eraser tool for removing strokes
  - Text tool for adding text anywhere on the canvas
  - Image insertion and manipulation

- **Canvas Features**
  - Infinite canvas with pan and zoom
  - Select, move, resize, and delete objects
  - Undo/Redo functionality
  - Auto-save every 5 minutes

- **File Operations**
  - Save canvas as JSON (custom format)
  - Load saved canvas files
  - Export canvas as PNG image

- **Keyboard Shortcuts**
  - `D` - Draw tool
  - `E` - Erase tool
  - `S` - Select tool
  - `T` - Text tool
  - `I` - Insert image
  - `Ctrl+Z` - Undo
  - `Ctrl+Y` or `Ctrl+Shift+Z` - Redo
  - `Ctrl+S` - Save
  - `Ctrl+O` - Load
  - `Ctrl+E` - Export PNG
  - `Delete` or `Backspace` - Delete selected object
  - `+` or `=` - Zoom in
  - `-` - Zoom out
  - `Ctrl+Click` or `Middle Mouse` - Pan canvas

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Navigate to the project directory:
```bash
cd infinite-canvas-app
```

2. Install dependencies:
```bash
npm install
```

## Development

To run the application in development mode:

```bash
npm run dev
```

This will:
- Start the Vite development server on `http://localhost:5173`
- Launch the Electron application
- Enable hot module replacement for React components

## Building for Windows

To build a Windows `.exe` installer:

```bash
npm run build:win
```

The built installer will be located in the `dist` folder.

### Build Output

After building, you'll find:
- `dist/Infinite Canvas Setup X.X.X.exe` - Windows installer
- `dist/win-unpacked/` - Unpacked application files

## Project Structure

```
infinite-canvas-app/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script for secure IPC
├── src/
│   ├── components/
│   │   ├── Toolbar.jsx  # Main toolbar component
│   │   └── ZoomControls.jsx  # Zoom controls
│   ├── canvas/
│   │   ├── Canvas.jsx   # Main canvas component
│   │   └── Canvas.css
│   ├── state/
│   │   └── store.js     # Zustand state management
│   ├── App.jsx          # Root component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.js       # Vite configuration
├── electron-builder.yml # Electron Builder configuration
└── README.md
```

## Technologies Used

- **Electron** - Desktop application framework
- **React** - UI library
- **Vite** - Build tool and dev server
- **Konva.js / react-konva** - 2D canvas library
- **Zustand** - State management
- **nanoid** - Unique ID generation

## Usage Tips

1. **Panning**: Hold `Ctrl` and drag with left mouse button, or use middle mouse button
2. **Zooming**: Use mouse wheel, or `+`/`-` keys, or zoom controls in bottom-right
3. **Text Editing**: Double-click on text objects to edit them
4. **Object Selection**: Click on objects when using the select tool
5. **Resizing**: Select an object and use the corner handles to resize
6. **Auto-save**: The canvas automatically saves every 5 minutes to `autosave.json` in the app data directory

## File Format

The canvas is saved as JSON with the following structure:

```json
{
  "objects": [
    {
      "id": "unique-id",
      "type": "path|text|image",
      // ... object-specific properties
    }
  ],
  "scale": 1.0,
  "position": { "x": 0, "y": 0 },
  "version": "1.0"
}
```

## Troubleshooting

### Build Issues

If you encounter issues building the Windows executable:

1. Ensure you have all dependencies installed: `npm install`
2. Try cleaning and rebuilding: `rm -rf dist node_modules && npm install && npm run build:win`

### Development Issues

If the app doesn't start in development:

1. Check that port 5173 is not in use
2. Ensure all dependencies are installed
3. Try deleting `node_modules` and reinstalling

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
