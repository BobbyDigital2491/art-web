/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import HierarchyPanel from './HierarchyPanel';
import { OrbitControls } from './OrbitControls';
import { HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi';
import { FaArrowsAlt, FaSync, FaExpand } from 'react-icons/fa';
import { Project } from '@/types';
import AssetRenderer from './AssetRenderer';

interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface SceneEditorProps {
  project: Project;
}

export default function SceneEditor({ project }: SceneEditorProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(project);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [isControlsPanelOpen, setIsControlsPanelOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [transforms, setTransforms] = useState<Transform>({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  });
  const [history, setHistory] = useState<{ transform: Transform }[]>([
    { transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleSelectAsset = (newProject: Project) => {
    setSelectedProject(newProject);
    const reset: Transform = {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
    setTransforms(reset);
    setHistory([{ transform: reset }]);
    setHistoryIndex(0);
  };

  const handleTransformChange = (transform: Transform) => {
    setTransforms(transform);
    const newHistory = [...history.slice(0, historyIndex + 1), { transform }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleResetTransforms = () => {
    const reset: Transform = {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
    setTransforms(reset);
    const newHistory = [...history.slice(0, historyIndex + 1), { transform: reset }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    setHistoryIndex(historyIndex - 1);
    setTransforms(history[historyIndex - 1].transform);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(historyIndex + 1);
    setTransforms(history[historyIndex + 1].transform);
  };

  const handleNumericInput = (
    type: 'position' | 'rotation' | 'scale',
    axis: 'x' | 'y' | 'z',
    value: number
  ) => {
    setTransforms((prev) => {
      const newTransform = { ...prev };
      if (type === 'position') {
        newTransform.position = [...prev.position] as [number, number, number];
        newTransform.position[['x', 'y', 'z'].indexOf(axis)] = value;
      } else if (type === 'rotation') {
        newTransform.rotation = [...prev.rotation] as [number, number, number];
        newTransform.rotation[['x', 'y', 'z'].indexOf(axis)] = THREE.MathUtils.degToRad(value);
      } else {
        newTransform.scale = [...prev.scale] as [number, number, number];
        newTransform.scale[['x', 'y', 'z'].indexOf(axis)] = value;
      }
      handleTransformChange(newTransform);
      return newTransform;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTransformMode('translate');
        return;
      }
      switch (e.key.toLowerCase()) {
        case 't':
          setTransformMode('translate');
          break;
        case 'r':
          setTransformMode('rotate');
          break;
        case 's':
          setTransformMode('scale');
          break;
        case 'g':
          setShowGrid((g) => !g);
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, handleRedo, handleUndo]);

  const cameraPosition: [number, number, number] = [
    transforms.position[0],
    transforms.position[1] + 2,
    transforms.position[2] + 5,
  ];

  return (
    <div className="relative h-screen w-full bg-gray-900">
      {/* Hierarchy Panel */}
      <HierarchyPanel
        selectedProject={selectedProject}
        onSelectAsset={handleSelectAsset}
        selectedProjectId={selectedProject?.id || null}
      />

      {/* Transform Controls Panel */}
      <div
        className={`absolute top-4 right-4 bg-white rounded-xl shadow-2xl z-50 transition-all duration-300 overflow-hidden ${
          isControlsPanelOpen ? 'w-80' : 'w-12'
        }`}
      >
        <button
          onClick={() => setIsControlsPanelOpen(!isControlsPanelOpen)}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200 transition z-10"
        >
          {isControlsPanelOpen ? (
            <HiChevronDoubleRight className="h-5 w-5 text-gray-600" />
          ) : (
            <HiChevronDoubleLeft className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {isControlsPanelOpen && (
          <div className="p-6 pr-12">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Transform Controls</h2>
            <p className="text-xs text-gray-500 mb-4">
              T (Move) • R (Rotate) • S (Scale) • G (Grid) • Ctrl+Z (Undo)
            </p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTransformMode('translate')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                  transformMode === 'translate'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <FaArrowsAlt className="h-4 w-4" />
                <span className="text-sm font-medium">Move</span>
              </button>
              <button
                onClick={() => setTransformMode('rotate')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                  transformMode === 'rotate'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <FaSync className="h-4 w-4" />
                <span className="text-sm font-medium">Rotate</span>
              </button>
              <button
                onClick={() => setTransformMode('scale')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                  transformMode === 'scale'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <FaExpand className="h-4 w-4" />
                <span className="text-sm font-medium">Scale</span>
              </button>
            </div>

            {selectedProject && (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Position</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['x', 'y', 'z'] as const).map((axis) => (
                        <input
                          key={axis}
                          type="number"
                          step="0.1"
                          value={transforms.position[['x', 'y', 'z'].indexOf(axis)]}
                          onChange={(e) =>
                            handleNumericInput('position', axis, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 text-xs border rounded focus:border-blue-500 focus:outline-none"
                          placeholder={axis.toUpperCase()}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700">Rotation (°)</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['x', 'y', 'z'] as const).map((axis) => (
                        <input
                          key={axis}
                          type="number"
                          step="1"
                          value={Math.round(THREE.MathUtils.radToDeg(transforms.rotation[['x', 'y', 'z'].indexOf(axis)]))}
                          onChange={(e) =>
                            handleNumericInput('rotation', axis, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 text-xs border rounded focus:border-blue-500 focus:outline-none"
                          placeholder={axis.toUpperCase()}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700">Scale</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['x', 'y', 'z'] as const).map((axis) => (
                        <input
                          key={axis}
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={transforms.scale[['x', 'y', 'z'].indexOf(axis)].toFixed(2)}
                          onChange={(e) =>
                            handleNumericInput('scale', axis, parseFloat(e.target.value) || 1)
                          }
                          className="w-full px-2 py-1 text-xs border rounded focus:border-blue-500 focus:outline-none"
                          placeholder={axis.toUpperCase()}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleResetTransforms}
                  className="w-full mt-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                  Reset All Transforms
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: cameraPosition, fov: 60 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(window.devicePixelRatio);
        }}
      >
        <color attach="background" args={['#1a1a1a']} />
        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={50}
        />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        {showGrid && <gridHelper args={[50, 50, '#444444', '#333333']} />}
        {selectedProject && (
          <Suspense fallback={null}>
            <AssetRenderer
              key={selectedProject.id}
              targetPath={selectedProject.target_path}
              position={transforms.position}
              rotation={transforms.rotation}
              scale={transforms.scale}
              transformMode={transformMode}
              onTransformChange={handleTransformChange}
            />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
}