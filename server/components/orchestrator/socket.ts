import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import type { Request } from "express";
import logger, { logWst } from "../../utils/log";
import { randomUlid } from "../../utils/uid";
import session from "../../utils/session";
import * as orchestrator from "./controller";
import { ctrl as chatCtrl } from "../chats";

export const wss = new WebSocketServer({ noServer: true });

/**
 * Handles WebSocket connections and messages.
 */
function onConnection(ws: WebSocket, req: Request, type: "chat" | "projects") {
  session(req, {} as any, async () => {
    const userId = req.session.id;

    if (!userId) {
      return;
    }

    /**
     * Sends a response to the WebSocket client.
     */
    const send = (response: string) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(response);
      } else {
        logger.warn("WebSocket is not open, cannot send message", {
          userId: req.session.id,
        });
      }
    };

    logger.debug("Projects websocket connection established", {
      userId: req.session.id,
    });

    let currentProjectId: string | undefined;
    let currentChatId: string | undefined;

    ws.on("error", logger.error);
    ws.on("message", async (data) => {
      const form = JSON.parse(data.toString());

      switch (form.cmd) {
        case "projects/new":
          currentProjectId = await orchestrator.newProject(send, userId);

          // @ts-ignore
          req.session.currentProjectId = currentProjectId;
          req.session.save();
          break;
        case "projects/switch":
          currentProjectId = await orchestrator.switchProject(
            send,
            userId,
            form.projectId,
          );
          // @ts-ignore
          req.session.currentProjectId = currentProjectId;
          req.session.save();
          break;
        case "projects/start":
          if (form.projectId !== currentProjectId) {
            logger.warn("Project ID mismatch", {
              userId,
              formProjectId: form.projectId,
              currentProjectId,
            });
            return;
          }

          const { projectId, title, prompt } = form;

          await orchestrator.startProject(
            send,
            userId,
            projectId,
            title,
            prompt,
          );
          break;
        case "projects/open":
          await orchestrator.openDocument(
            send,
            userId,
            currentProjectId!,
            form.documentId,
            form.editing === "true",
          );
          break;
        case "projects/close":
          await orchestrator.closeDocument(
            send,
            userId,
            currentProjectId!,
            form.documentId,
            form.editing === "true",
          );
          break;
        case "documents/diff":
          await orchestrator.diffDocument(
            send,
            userId,
            currentProjectId!,
            form.documentId,
            form.content,
          );
          break;
        case "documents/confirm":
          await orchestrator.confirmChanges(
            send,
            userId,
            currentProjectId!,
            form.id,
            form.content,
            form.action,
          );
          break;
        case "chats/messages/new":
          let resultId = await orchestrator.newChatMessage(send, {
            userId,
            chatId: currentChatId,
            message: form.message,
          });

          if (resultId) {
            currentChatId = resultId;
            // @ts-ignore
            req.session.currentChatId = currentChatId;
            req.session.save();
          }
          break;
        case "chats/new":
          currentChatId = `chat-${randomUlid()}`;

          currentChatId = await orchestrator.newChat(send, userId);

          // @ts-ignore
          req.session.currentChatId = currentChatId;
          req.session.save();
          break;
        case "chats/switch":
          if (!form.chatId) {
            logger.warn("No chatId provided for chats/switch command", {
              userId,
            });
            return;
          }
          if (form.chatId === currentChatId) {
            return;
          }

          currentChatId = form.chatId;
          // @ts-ignore
          req.session.currentChatId = currentChatId;
          req.session.save();

          await orchestrator.switchChat(send, userId, currentChatId!);
          break;
        case "users/new":
          logWst.removeUser(userId);
          req.session.destroy(function (err) {
            if (err) {
              logger.error("Failed to regenerate session", { error: err });
              return;
            }
          });
          break;
        case "projects/clear":
          await orchestrator.clearProjects(send, userId);

          currentProjectId = undefined;
          // @ts-ignore
          req.session.currentProjectId = undefined;
          req.session.save();
          break;
        case "data/clear":
          await orchestrator.clearMemory(send, userId);
          logWst.removeUser(userId);
          req.session.destroy(function (err) {
            if (err) {
              logger.error("Failed to regenerate session", { error: err });
              return;
            }
          });
          break;
        default:
          logger.warn("Unknown command received", { cmd: form.cmd, userId });
          return;
      }
    });

    switch (type) {
      case "projects":
        currentProjectId = await orchestrator.initializeProjects(
          send,
          userId,
          currentProjectId,
        );
        // @ts-ignore
        req.session.currentProjectId = currentProjectId;
        break;
      case "chat":
        currentChatId = await orchestrator.initializeChat(
          send,
          userId,
          currentChatId,
        );

        // @ts-ignore
        req.session.currentChatId = currentChatId;
        break;
      default:
        logger.warn("Unknown WebSocket type", { type, userId });
        return;
    }

    req.session.save();
  });
}

wss.on("connection", onConnection);
