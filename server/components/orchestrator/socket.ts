import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import type { Request } from "express";
import logger, { logWst } from "../../utils/log";
import { randomUlid } from "../../utils/uid";
import session from "../../utils/session";
import * as ctrl from "./controller";
import { use } from "marked";

export const wss = new WebSocketServer({ noServer: true });

/**
 * Handles WebSocket connections and messages.
 */
function onConnection(ws: WebSocket, req: Request) {
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

    ws.on("error", logger.error);
    ws.on("message", async (data) => {
      const form = JSON.parse(data.toString());

      switch (form.cmd) {
        case "new_project":
          currentProjectId = await ctrl.newProject(send, userId);

          // @ts-ignore
          req.session.currentProjectId = currentProjectId;
          req.session.save();
          break;
        case "switch_project":
          currentProjectId = await ctrl.switchProject(
            send,
            userId,
            form.projectId,
          );
          // @ts-ignore
          req.session.currentProjectId = currentProjectId;
          req.session.save();
          break;
        case "start_project":
          if (form.projectId !== currentProjectId) {
            logger.warn("Project ID mismatch", {
              userId,
              formProjectId: form.projectId,
              currentProjectId,
            });
            return;
          }

          const { projectId, title, prompt } = form;

          await ctrl.crawlPages(send, userId, projectId, title, prompt);
          break;
        case "edit_document":
          await ctrl.editDocument(
            send,
            userId,
            currentProjectId!,
            form.documentId,
            form.editing,
          );
          break;
        case "close_document":
          await ctrl.closeDocument(
            send,
            userId,
            currentProjectId!,
            form.documentId,
            form.editing,
          );
          break;
        case "diff_document":
          await ctrl.diffDocument(
            send,
            userId,
            currentProjectId!,
            form.documentId,
            form.content,
          );
          break;
        case "confirm_changes":
          await ctrl.confirmChanges(
            send,
            userId,
            currentProjectId!,
            form.id,
            form.content,
            form.action,
          );
          break;
        default:
          logger.warn("Unknown command received", { cmd: form.cmd, userId });
          return;
      }
    });

    currentProjectId = await ctrl.initializeProjects(
      send,
      userId,
      currentProjectId,
    );
    // @ts-ignore
    req.session.currentProjectId = currentProjectId;
    req.session.save();
  });
}

wss.on("connection", onConnection);
