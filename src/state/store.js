import { create } from 'zustand';
import { nanoid } from 'nanoid';

const useStore = create((set, get) => ({
  // Tool state
  tool: 'draw', // 'draw', 'erase', 'select', 'text', 'image'
  color: '#ffffff',
  strokeWidth: 5,

  // Canvas state
  scale: 1,
  position: { x: 0, y: 0 },

  // Objects on canvas
  objects: [],
  selectedObjectId: null,

  // History for undo/redo
  history: [[]],
  historyIndex: 0,

  // Drawing state
  isDrawing: false,
  currentPath: null,

  // Text editing state
  editingTextId: null,

  // Pending image for insertion
  pendingImage: null,

  // Actions
  setTool: (tool) => set({ tool, selectedObjectId: null }),
  setColor: (color) => set({ color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),

  addObject: (object) => {
    const newObject = { ...object, id: nanoid() };
    set((state) => {
      const newObjects = [...state.objects, newObject];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newObjects)));
      return {
        objects: newObjects,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
    return newObject.id;
  },

  updateObject: (id, updates) => {
    set((state) => {
      const newObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      );
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newObjects)));
      return {
        objects: newObjects,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  deleteObject: (id) => {
    set((state) => {
      const newObjects = state.objects.filter((obj) => obj.id !== id);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newObjects)));
      return {
        objects: newObjects,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
      };
    });
  },

  deleteSelected: () => {
    const { selectedObjectId, deleteObject } = get();
    if (selectedObjectId) {
      deleteObject(selectedObjectId);
    }
  },

  setSelectedObject: (id) => set({ selectedObjectId: id }),

  setObjects: (objects) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(objects)));
      return {
        objects,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedObjectId: null,
      };
    });
  },

  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setCurrentPath: (path) => set({ currentPath: path }),

  setEditingTextId: (id) => set({ editingTextId: id }),

  setPendingImage: (image) => set({ pendingImage: image }),

  // Undo/Redo
  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          objects: JSON.parse(JSON.stringify(state.history[newIndex])),
          historyIndex: newIndex,
          selectedObjectId: null,
        };
      }
      return state;
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          objects: JSON.parse(JSON.stringify(state.history[newIndex])),
          historyIndex: newIndex,
          selectedObjectId: null,
        };
      }
      return state;
    });
  },

  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },

  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },

  // Save/Load
  getCanvasData: () => {
    const state = get();
    return {
      objects: state.objects,
      scale: state.scale,
      position: state.position,
      version: '1.0',
    };
  },

  loadCanvasData: (data) => {
    set({
      objects: data.objects || [],
      scale: data.scale || 1,
      position: data.position || { x: 0, y: 0 },
      history: [JSON.parse(JSON.stringify(data.objects || []))],
      historyIndex: 0,
      selectedObjectId: null,
    });
  },

  resetCanvas: () => {
    set({
      objects: [],
      scale: 1,
      position: { x: 0, y: 0 },
      history: [[]],
      historyIndex: 0,
      selectedObjectId: null,
      isDrawing: false,
      currentPath: null,
      editingTextId: null,
      pendingImage: null,
    });
  },
}));

export default useStore;
