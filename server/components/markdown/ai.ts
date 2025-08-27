import { z } from "zod";
import { llm } from "../../services/ai/ai";
import { generateObject } from "ai";

const ChunkedFileSchema = z.object({
  chunks: z.array(z.string()).describe("An array of content chunks"),
});

export type ChunkedFile = z.infer<typeof ChunkedFileSchema>;

export async function modifyContent(content: string, prompt: string) {
  const ModificationSchema = z.object({
    modifiedContent: z.string(),
  });

  const response = await generateObject({
    model: llm.mediumModel,
    messages: [
      {
        role: "system",
        content: `
          You are an AI assistant that modifies markdown based on user instructions.
          You will respond with a JSON object containing the modified content.
          Given the original content and user instructions, you must always respond with a JSON object that matches the following schema:
          
          {
            "modifiedContent": "<the modified content>"
          }
          
          The modified content should reflect the user's instructions while preserving the original meaning as much as possible.
        `,
      },
      {
        role: "user",
        content: `
          Original Content:
          """
          ${content}
          """
          
          Instructions:
          """
          ${prompt}
          """
          
          Please provide the modified content.
        `,
      },
    ],
    schema: ModificationSchema,
  });

  return response.object.modifiedContent;
}

export async function matchPromptToUrl(prompt: string, urls: string[]) {
  if (urls.length === 0) {
    return "";
  }

  const UrlMatchSchema = z.object({
    matchedUrl: z
      .string()
      .describe("A single URL that matches the user's prompt"),
  });

  const response = await generateObject({
    model: llm.smallModel,
    messages: [
      {
        role: "system",
        content: `
          You are an AI assistant that matches user prompts to relevant URLs.
          You will respond with a JSON object containing an array of URLs that are relevant to the user's prompt.
          
          Only include the URL that is directly relevant to the user's prompt. If none are relevant, respond with an empty string.
        `,
      },
      {
        role: "user",
        content: `
          User Prompt:
          """
          ${prompt}
          """
          
          Available URLs:
          """
          ${urls.join("\n")}
          """
          
          Please provide the matched URL.
        `,
      },
    ],
    schema: UrlMatchSchema,
  });

  return response.object.matchedUrl;
}

export async function chunkFile(content: string, maxChunkSize: number = 1000) {
  const response = await generateObject({
    model: llm.smallModel,
    messages: [
      {
        role: "system",
        content: `
          You are an AI assistant that breaks down markdown files into smaller chunks.
          Break down the markdown content based on natural sections, such as headings, lists, and paragraphs.

          The maximum size of each chunk should be ${maxChunkSize} characters.
          Ensure that chunks do not exceed this size, but try to keep them as large as possible without breaking the flow of the content.
        `,
      },
      {
        role: "user",
        content: `
          Original Content:
          """
          ${content}
          """
          
          Please provide the content broken down into smaller chunks.
        `,
      },
    ],
    schema: ChunkedFileSchema,
  });

  return response.object;
}
