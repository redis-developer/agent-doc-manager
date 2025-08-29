import { ShortTermMemory } from "../memory";
import { getCommand } from "./ai";
import logger from "../../utils/log";
import { getUrlAndInstructions } from "./ai";

export async function extractUrlAndInstructions(prompt: string) {
  logger.debug("Extracting URL and instructions from prompt", {
    prompt,
  });
  const result = await getUrlAndInstructions(prompt);

  logger.debug(`Extracted URL: ${result.url}`, {
    result,
  });
  return result;
}

export async function extractCommand(messages: ShortTermMemory[]) {
  logger.debug("Extracting command for latest message", {
    message: messages[messages.length - 1].content,
  });

  const command = await getCommand(messages);

  logger.debug(`Extracted command: ${command.command}`, {
    command,
  });

  return command;
}
