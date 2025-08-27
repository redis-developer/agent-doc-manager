import { llm } from "../../services/ai/ai";
import { generateText } from "ai";
import { ChatMessage } from "../memory";
import type { Command } from "../parser";

export async function generateResponse(
  messages: ChatMessage[],
  command: Command,
  initialResponse: string | null = null,
): Promise<string> {
  const response = await generateText({
    model: llm.mediumChat,
    messages: [
      {
        role: "system",
        content: `
        Based on the user's input and an initial procedural response, generate a user-friendly response that makes sense based on the command extracted from the message history.

        The procedural response from executing the command is: ${initialResponse ?? "No response available"}.
        The command extracted is: ${command.command}
        
        If the command is "crawl_pages", respond with a message indicating that the pages have been extracted from the provided URL: ${command.url}.
        If the command is "modify_extracted_text", respond with a message indicating that the specified page (${command.pageName}) has being modified based on the provided instructions: ${command.instructions}.

        Ensure that your response is clear and concise, and directly relates to the command provided.
      `,
      },
      ...messages,
    ],
  });

  return response.text;
}
