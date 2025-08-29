import * as ctrl from "./controller";
export * as ctrl from "./controller";
export type { Document, DocumentChunk } from "./controller";

export async function initialize() {
  await ctrl.initialize();
}
