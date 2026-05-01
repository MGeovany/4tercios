// Normalised face-detection result used across the app.
// Coordinates are normalised 0..1 against the full image; embeddings are L2-normalised vectors.

export type Bbox = { x: number; y: number; w: number; h: number };

export type FaceDetection = {
  bbox: Bbox;
  embedding: number[];
  quality: number;
};

export type FaceProvider = {
  /** Name shown in logs and tracing. */
  readonly name: string;
  /** Embedding dimensionality. Must match the `vector(N)` column in the DB. */
  readonly dimension: number;
  /** Detect every face in the image and return its embedding. Empty array = no faces. */
  detect(input: { imageUrl: string; signal?: AbortSignal }): Promise<FaceDetection[]>;
  /** Convenience: detect and return the highest-quality face. Used for selfies. */
  embedBestFace(input: { imageUrl: string; signal?: AbortSignal }): Promise<FaceDetection | null>;
};

export const FACE_EMBEDDING_DIMENSION = 512;
