import { Tool } from "ai";
import z from "zod";

export const SearchDocumentChunksToolInput = z.object({
  query: z.string().min(1).describe("The search query"),
});

export type SearchDocumentChunksToolInputType = z.infer<
  typeof SearchDocumentChunksToolInput
>;

export function getSearchDocumentChunksTool(
  execute: (input: SearchDocumentChunksToolInputType) => Promise<string>,
): Tool & { name: string } {
  return {
    name: "search_documents",
    description:
      "Useful for when you need to find relevant information from the ingested documents to help answer a question or complete a task.",
    inputSchema: SearchDocumentChunksToolInput,
    execute,
  };
}
