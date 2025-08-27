import logger from "../../utils/log";
import * as memory from "../memory";
import { ctrl as parser } from "../parser";
import { ctrl as crawler } from "../crawl";
import { ctrl as download } from "../download";
import { ctrl as markdown } from "../markdown";
import { ctrl as responder } from "../responder";
import { ctrl as qa } from "../qa";

export async function processIncommingMessage(
  userId: string,
  chat: memory.ChatModel,
) {
  const messages = await chat.messages();
  const command = await parser.extractCommand(messages);
  const lastUserMessage = messages[messages.length - 1].content;
  let response = "";

  try {
    switch (command.command) {
      case "crawl_pages":
        if (command.url && command.instructions) {
          logger.info(`Crawl pages tool called for URL: ${command.url}`, {
            userId,
            url: command.url,
            instructions: command.instructions,
          });
          const files = await crawler.crawlUrl(
            userId,
            command.url,
            command.instructions,
          );
          logger.debug(`Crawl tool result: ${files.length} URLs found`, {
            userId,
          });
          response = await responder.getResponse(
            messages,
            command,
            `Extracted ${files.length} pages from ${command.url}:\n${files.map((f) => f.url).join("\n")}`,
          );
        } else {
          logger.warn(`No URL provided for crawl_pages command`, {
            userId,
          });
        }
        break;
      case "modify_text":
        if (command.pageName && command.instructions) {
          const files = await markdown.searchFiles(userId, command.pageName);
          if (files.length === 0) {
            logger.warn(`No file found with name \`${command.pageName}\``, {
              userId,
            });
            response = `No file found with name \`${command.pageName}\``;
            break;
          }
          const result = await markdown.modifyFileContent(
            files[0],
            command.instructions,
          );
          logger.info(`Modified the page: ${result.url}`, {
            userId,
          });
          await download.updateDownload(userId, result);
          response = await responder.getResponse(
            messages,
            command,
            `Modified page ${command.pageName} based on instructions: ${command.instructions}`,
          );
        } else {
          logger.warn(
            `No pageName or instructions provided for modify_text command`,
            {
              userId,
            },
          );

          response =
            "You need to provide both a page name and instructions to modify the text.";
        }
        break;
      case "answer_question":
        response = await qa.answerQuestion(userId, lastUserMessage);
        break;
      case "download_page":
        if (command.pageName) {
          try {
            const url = await download.prepareForDownload(
              userId,
              command.pageName,
            );
            response = `You can download the page \`${command.pageName}\` here: ${url}`;
          } catch (error) {
            logger.error(`Download page tool failed:`, {
              error,
              userId,
              pageName: command.pageName,
            });
            response = `Failed to prepare download for page \`${command.pageName}\``;
          }
        } else {
          logger.warn(`No pageName provided for download_page command`, {
            userId,
          });
          response = "You need to provide a page name to download.";
        }
        break;
      case "none":
        // No action needed
        response = "You need to be more specific.";
        break;
      default:
        logger.warn(`Unknown command: ${command.command}`, {
          userId,
        });
        response = "You need to be more specific.";
        break;
    }
  } catch (error) {
    logger.error("Failed to process incoming message:", {
      error,
      userId,
      lastUserMessage,
      command,
    });
    response = "Sorry, something went wrong while processing your message.";
  }

  return response;
}
