import * as memory from "../memory";
import type { Command } from "../parser";
import { generateResponse } from "./ai";

export async function getResponse(
  messages: memory.ShortTermMemory[],
  command: Command,
  initialResponse: string,
) {
  return generateResponse(messages, command, initialResponse);
}
