import { z } from "zod";
import { llm } from "../../services/ai/ai";
import { generateObject, generateText } from "ai";
import { ChatMessage } from "../memory";

const CommandsEnumSchema = z.enum([
  "crawl_pages",
  "modify_text",
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
    model: llm.smallModel,
    messages: [
      {
        role: "system",
        content: `
          You are an AI assistant that converts a user prompt intent into an actionable command.

          The available commands are:
          - "crawl_pages": Extract pages from a given URL. Requires the "url" argument.
          - "modify_text": Modify the text of an already extracted page. Requires the "pageName" and "instructions" arguments.
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
               "command": "modify_text",
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

export async function generateResponse(
  messages: ChatMessage[],
  command: Command,
  initialResponse: string | null = null,
): Promise<string> {
  const response = await generateText({
    model: llm.mediumModel,
    messages: [
      {
        role: "system",
        content: `
        Based on the user's input and an initial procedural response, generate a user-friendly response that makes sense based on the command extracted from the message history.

        The procedural response from executing the command is: ${initialResponse ?? "No response available"}.
        The command extracted is: ${command.command}
        
        If the command is "crawl_pages", respond with a message indicating that the pages have been extracted from the provided URL: ${command.url}.
        If the command is "modify_text", respond with a message indicating that the specified page (${command.pageName}) has being modified based on the provided instructions: ${command.instructions}.

        Ensure that your response is clear and concise, and directly relates to the command provided.
      `,
      },
      ...messages,
    ],
  });

  return response.text;
}
