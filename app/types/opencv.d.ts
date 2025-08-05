declare module '@techstark/opencv-js' {
  interface CV {
    imread: (src: HTMLImageElement | HTMLCanvasElement) => Mat;
    cvtColor: (src: Mat, dst: Mat, code: number) => void;
    ORB: new (nfeatures?: number) => ORB;
    BFMatcher: new (normType?: number, crossCheck?: boolean) => BFMatcher;
    matFromArray: (rows: number, cols: number, type: number, array: number[]) => Mat;
    solvePnP: (
      objectPoints: Mat,
      imagePoints: Mat,
      cameraMatrix: Mat,
      distCoeffs: Mat,
      rvec: Mat,
      tvec: Mat,
      useExtrinsicGuess?: boolean
    ) => boolean;
    Rodrigues: (src: Mat, dst: Mat) => void;
    Mat: new () => Mat;
    KeyPointVector: new () => KeyPointVector;
    DMatchVector: new () => DMatchVector;
    COLOR_RGBA2GRAY: number;
    NORM_HAMMING: number;
    CV_64F: number;
  }

  interface Mat {
    delete: () => void;
    data64F: Float64Array;
  }

  interface KeyPointVector {
    get: (index: number) => KeyPoint;
    size: () => number;
    delete: () => void;
  }

  interface KeyPoint {
    pt: { x: number; y: number };
  }

  interface DMatchVector {
    get: (index: number) => DMatch;
    size: () => number;
    delete: () => void;
  }

  interface DMatch {
    queryIdx: number;
    trainIdx: number;
    distance: number;
  }

  interface ORB {
    detectAndCompute: (image: Mat, mask: Mat, keypoints: KeyPointVector, descriptors: Mat) => void;
  }

  interface BFMatcher {
    match: (descriptors1: Mat, descriptors2: Mat, matches: DMatchVector) => void;
  }

  const cv: CV;
  export default cv;
  export { CV };
}declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import * as THREE from 'three';

  export interface GLTF {
    scene: THREE.Group;
    scenes: THREE.Group[];
    animations: THREE.AnimationClip[];
    cameras: THREE.Camera[];
    asset: object;
  }

  export class GLTFLoader {
    constructor(manager?: THREE.LoadingManager);
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}