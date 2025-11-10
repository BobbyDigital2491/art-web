/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import Image from 'next/image';
import * as THREE from 'three';

export default function ARScene() {
  const { projectId } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('ar_assets')
        .select('*')
        .eq('id', projectId)
        .eq('status', 'published')
        .single();

      if (error || !data) {
        setError('Project not found or not published');
      } else {
        setProject(data);
      }
      setLoading(false);
    };

    if (projectId) fetchProject();
  }, [projectId]);

  const startAR = async () => {
    if (!navigator.xr) {
      alert('WebXR not supported. Use Safari (iPhone) or Chrome (Android).');
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      if (!supported) {
        alert('AR not supported on this device.');
        return;
      }

      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
      });

      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      const gl = canvas.getContext('webgl2', { xrCompatible: true })!;
      const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      camera.matrixAutoUpdate = false;

      session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });

      // Lighting
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      // 3D Object
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
      const cube = new THREE.Mesh(geometry, material);
      cube.visible = false;
      scene.add(cube);

      const referenceSpace = await session.requestReferenceSpace('viewer');

      // LINE 103 FIXED — non-null assertion because hit-test is required
      const hitTestSource = await session.requestHitTestSource!({ space: referenceSpace });

      const onXRFrame = (time: number, frame: XRFrame) => {
        const pose = frame.getViewerPose(referenceSpace);
        if (pose) {
          const glLayer = session.renderState.baseLayer!;
          gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
          renderer.setSize(glLayer.framebufferWidth, glLayer.framebufferHeight);
          renderer.clear();

          for (const view of pose.views) {
            const viewport = glLayer.getViewport(view);
            if (viewport) {
              renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
            }
            camera.projectionMatrix.fromArray(view.projectionMatrix);
            const viewMatrix = new THREE.Matrix4().fromArray(view.transform.inverse.matrix);
            camera.matrixWorld.copy(viewMatrix).invert();
            renderer.render(scene, camera);
          }
        }

        // Image tracking — hitTestSource is guaranteed
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
          const hitPose = hitTestResults[0].getPose(referenceSpace);
          if (hitPose) {
            const poseMatrix = new THREE.Matrix4().fromArray(hitPose.transform.matrix);
            cube.matrix.copy(poseMatrix);
            cube.matrix.decompose(cube.position, cube.quaternion, cube.scale);
            cube.visible = true;
          }
        } else {
          cube.visible = false;
        }

        session.requestAnimationFrame(onXRFrame);
      };

      session.requestAnimationFrame(onXRFrame);

      document.getElementById('ar-ui')!.style.display = 'none';
      document.getElementById('ar-success')!.style.display = 'flex';

    } catch (err: any) {
      alert('AR failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-yellow-600 mb-6"></div>
          <p className="text-2xl font-bold text-gray-800">Loading AR Experience...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-3xl shadow-2xl">
          <p className="text-2xl text-red-600 font-bold mb-4">{error || 'Project not found'}</p>
          <a href="/" className="text-indigo-600 hover:underline text-lg">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* UI */}
      <div id="ar-ui" className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-white/95 backdrop-blur-lg px-12 py-10 rounded-3xl shadow-3xl text-center max-w-lg">
          <h3 className="text-4xl font-bold text-gray-900 mb-6">AR Experience Ready</h3>
          <p className="text-xl text-gray-700 mb-8">Tap below to open camera</p>
          <button
            onClick={startAR}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-3xl px-16 py-8 rounded-3xl transition transform hover:scale-110 shadow-3xl"
          >
            Start AR Camera
          </button>
          <div className="mt-10">
            <Image
              src={project.target_path}
              alt="Target"
              width={140}
              height={140}
              className="rounded-2xl mx-auto border-8 border-white shadow-2xl"
            />
            <p className="text-lg text-gray-600 mt-4 font-medium">Project: {project.project_name}</p>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Works on iPhone (Safari) • Android (Chrome)
          </p>
        </div>
      </div>

      {/* Success */}
      <div id="ar-success" className=" absolute inset-0 flex items-center justify-center bg-black/90">
        <div className="text-center">
          <p className="text-5xl font-bold text-green-400 mb-6 animate-pulse">AR Camera Active!</p>
          <p className="text-3xl text-white">Point at any surface</p>
          <p className="text-xl text-gray-300 mt-4">3D object will appear</p>
        </div>
      </div>
    </div>
  );
}