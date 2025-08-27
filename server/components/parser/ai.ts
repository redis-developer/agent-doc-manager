import { z } from "zod";
import { llm } from "../../services/ai/ai";
import { generateObject, generateText } from "ai";
import { ChatMessage } from "../memory";

const CommandsEnumSchema = z.enum([
  "crawl_pages",
  "modify_extracted_text",
  "view_extracted_text",
  "answer_question",
  "download_page",
  "none",
]);

export type CommandEnum = z.infer<typeof CommandsEnumSchema>;

const CommandSchema = z.object({
  command: CommandsEnumSchema.describe("The command to execute"),
  pageName: z
    .string()
    .optional()
    .describe("Name of the page to save or modify"),
  url: z.string().optional().describe("URL to extract pages from"),
  instructions: z
    .string()
    .optional()
    .describe("Instructions for extracting or modifying text"),
});

export type Command = z.infer<typeof CommandSchema>;

export async function getCommand(messages: ChatMessage[]) {
  const response = await generateObject({
    model: llm.smallChat,
    messages: [
      {
        role: "system",
        content: `
          You are an AI assistant that converts a user prompt intent into an actionable command.

          The available commands are:
          - "crawl_pages": Extract pages from a given URL. Requires the "url" argument.
          - "modify_extracted_text": Modify the text of an already extracted page. Requires the "pageName" and "instructions" arguments.
          - "view_extracted_text": View the text of an already extracted page. Requires the "pageName" argument.
          - "answer_question": Answer a question based on the extracted pages. No additional arguments required.
          - "download_page": Download a specific page. Requires the "pageName" argument.
          - "none": No action is required. This is used when the prompt does not require any of the above commands.

          The arguments for each command are:
          - "url": The URL to extract pages from (string).
          - "pageName": The name of the page to modify (string).
          - "instructions": Instructions for modifying the extracted text (string).
              - Don't add anything to the instructions that isn't in the prompt.

          Examples:
          1. Prompt: "Find all tutorial pages from https://example.com/tutorials"
             Response: {
               "command": "crawl_pages",
               "url": "https://example.com/tutorials",
               "instructions": "Find all tutorial pages."
             }

          2. Prompt: "Update the introduction section of the 'Getting Started' page to include more details about installation."
             Response: {
               "command": "modify_extracted_text",
               "pageName": "Getting Started",
               "instructions": "Update the introduction section to include more details."
             }
          
          3. Prompt: "Show me the content of the 'API Reference' page."
             Response: {
               "command": "view_extracted_text",
               "pageName": "API Reference"
             }

          4. Prompt: "What are the main topics covered in the extracted tutorials?"
             Response: {
               "command": "answer_question"
             }

          5. Prompt: "I want to download all the pages we've extracted so far."
             Response: {
               "command": "download_pages"
             }

          6. Prompt: "Hello, how are you today?"
             Response: {
               "command": "none"
             }
        `,
      },
      ...messages,
    ],
    schema: CommandSchema,
  });

  return response.object;
}
