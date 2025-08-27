import { ChatMessage } from "../memory";
import { getCommand } from "./ai";
import logger from "../../utils/log";

export async function extractCommand(messages: ChatMessage[]) {
  const command = await getCommand(messages);

  logger.info(`Extracted command: ${command.command}`, {
    command,
  });

  return command;
}
