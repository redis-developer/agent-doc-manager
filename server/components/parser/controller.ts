import { ChatMessage } from "../memory";
import { getCommand } from "./ai";
import logger from "../../utils/log";

export async function extractCommand(messages: ChatMessage[]) {
  logger.debug("Extracting command for latest message", {
    message: messages[messages.length - 1].content,
  });

  const command = await getCommand(messages);

  logger.debug(`Extracted command: ${command.command}`, {
    command,
  });

  return command;
}
