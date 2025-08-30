import logger from "../../utils/log";
import { llm, embedText } from "../../services/ai/ai";
import getClient from "../../redis";
import { ShortTermMemoryModel, WorkingMemoryModel } from "../memory";
import { randomUlid } from "../../utils/uid";
import { CommandEnum, ctrl as parser } from "../parser";
import { ctrl as crawler } from "../crawl";
import { ctrl as download } from "../download";
import { ctrl as documents } from "../documents";
import { ctrl as projects } from "../projects";
import { ctrl as qa } from "../qa";
import { ctrl as responder } from "../responder";
import * as view from "./view";
import type { Project } from "../projects";
import type { Document } from "../documents";

async function getProjectMemory(userId: string, projectId?: string) {
  const redis = getClient();

  return ShortTermMemoryModel.FromSessionId(redis, userId, projectId, {
    createUid: randomUlid,
  });
}

async function getWorkingMemory(userId: string) {
  const redis = getClient();

  return WorkingMemoryModel.New(redis, userId, {
    createUid: randomUlid,
    vectorDimensions: llm.dimensions,
    embed: embedText,
  });
}

/**
 * Initializes the chat by sending all previous messages to the WebSocket client.
 */
export async function initializeProjects(
  send: (message: string) => void,
  userId: string,
  currentProjectId?: string,
) {
  try {
    logger.debug(`Initializing projects for user \`${userId}\``, {
      userId,
    });

    const allProjects = await projects.all(userId);

    if (!currentProjectId && allProjects.length > 0) {
      currentProjectId = allProjects[0].projectId;
    }

    send(
      view.renderProjects({
        projects: allProjects,
        currentProjectId,
      }),
    );

    if (currentProjectId) {
      await switchProject(send, userId, currentProjectId);
    }

    return currentProjectId;
  } catch (error) {
    logger.error(`Failed to initialize chat for user \`${userId}\`:`, {
      error,
      userId,
    });
  }
}

export async function newProject(
  send: (message: string) => void,
  userId: string,
) {
  try {
    logger.debug(`Creating new project for user \`${userId}\``, {
      userId,
    });

    const project = await projects.create(userId);

    const allProjects = await projects.all(userId);

    send(
      view.renderProjects({
        projects: allProjects,
        currentProjectId: project.projectId,
      }),
    );

    send(
      view.renderInstructions({
        instructions:
          "Start by entering a project title and prompt, then you can get to work!",
      }),
    );

    send(view.renderNewProject(project));

    return project.projectId;
  } catch (error) {
    logger.error(`Failed to create new project for user \`${userId}\`:`, {
      error,
      userId,
    });
    throw error;
  }
}

export async function switchProject(
  send: (message: string) => void,
  userId: string,
  projectId: string,
) {
  const project = await projects.read(userId, projectId);

  if (!project) {
    logger.warn(`Project not found: ${projectId}`, {
      userId,
      projectId,
    });
    return;
  }

  const docs = await documents.all(userId, projectId);

  if (docs.length === 0) {
    send(
      view.renderInstructions({
        instructions:
          "Start by entering a project title and prompt, then you can get to work!",
      }),
    );

    send(view.renderNewProject(project));
  } else {
    send(
      view.renderDocumentsList({
        documents: docs,
      }),
    );
  }

  return project.projectId;
}

export async function crawlPages(
  send: (message: string) => void,
  userId: string,
  projectId: string,
  title: string,
  prompt: string,
) {
  await projects.update(userId, projectId, title, prompt);
  const { url, instructions } = await parser.extractUrlAndInstructions(prompt);
  let docs: Document[] = [];
  if (url && instructions) {
    logger.debug(`Crawl pages tool called for URL: ${url}`, {
      userId,
      projectId,
      url,
      instructions,
    });
    docs = await crawler.crawlUrl(userId, projectId, url, instructions);
    logger.debug(`Crawl tool result: ${docs.length} URLs found`, {
      userId,
      projectId,
    });
  } else {
    logger.warn(`No URL provided for crawl_pages command`, {
      userId,
      projectId,
    });
  }

  send(
    view.renderDocumentsList({
      documents: docs,
    }),
  );
}

export async function editDocument(
  send: (message: string) => void,
  userId: string,
  projectId: string,
  documentId: string,
  editing: boolean,
) {
  const doc = await documents.read(userId, documentId);

  if (!doc) {
    logger.warn(`Document not found: ${documentId}`, {
      userId,
      documentId,
    });
    return;
  }

  logger.debug(`Enabling edit mode for document \`${documentId}\``, {
    userId,
    documentId,
  });

  send(
    view.renderDocument({
      ...doc,
      selected: true,
      editing,
    }),
  );
}

export async function closeDocument(
  send: (message: string) => void,
  userId: string,
  projectId: string,
  documentId: string,
  editing: boolean,
) {
  const doc = await documents.read(userId, documentId);

  if (!doc) {
    logger.warn(`Document not found: ${documentId}`, {
      userId,
      documentId,
    });
    return;
  }

  logger.debug(`Disabling edit mode for document \`${documentId}\``, {
    userId,
    documentId,
  });

  send(
    view.renderDocument({
      ...doc,
      selected: false,
      editing,
    }),
  );
}

export async function diffDocument(
  send: (message: string) => void,
  userId: string,
  projectId: string,
  documentId: string,
  newContent: string,
) {
  send(
    view.renderInstructions({
      instructions:
        "Synthesizing the changes you made and how they can be applied to other documents...",
      progress: true,
    }),
  );

  const { actions } = await documents.diff(userId, documentId, newContent);

  logger.debug(`Generated diff for document \`${documentId}\``, {
    userId,
    documentId,
    actions,
  });

  send(
    view.renderInstructions({
      instructions: "",
      progress: false,
    }),
  );

  send(
    view.renderPopupForm({
      show: true,
      id: documentId,
      cmd: "confirm_changes",
      content: actions.join("\n\n"),
    }),
  );
}

export async function confirmChanges(
  send: (message: string) => void,
  userId: string,
  projectId: string,
  documentId: string,
  actions: string,
  action: "apply_all" | "apply" | "cancel",
) {
  send(
    view.renderPopupForm({
      show: false,
      id: "",
      cmd: "",
      content: "",
    }),
  );

  send(
    view.renderInstructions({
      instructions: "Processing your request...",
      progress: true,
    }),
  );

  const doc = await documents.read(userId, documentId);

  if (action === "cancel") {
    logger.debug(`User cancelled changes for document \`${documentId}\``, {
      userId,
      documentId,
    });
    send(
      view.renderDocument({
        ...doc!,
        selected: false,
      }),
    );

    send(
      view.renderInstructions({
        instructions: "",
        progress: false,
      }),
    );
    return;
  }

  const workingMemory = await getWorkingMemory(userId);
  await workingMemory.addLongTermMemory(
    "Markdown editing preferences",
    actions,
  );

  send(
    view.renderInstructions({
      instructions:
        action === "apply_all"
          ? "Applying changes to all documents..."
          : "Applying changes to the current document...",
      progress: true,
    }),
  );

  const allDocs = await documents.all(userId, projectId);

  if (action === "apply_all") {
    send(
      view.renderDocumentsList({
        documents: allDocs.map((doc) => {
          return {
            ...doc,
            selected: false,
            editing: true,
          };
        }),
      }),
    );

    await documents.applyToAll(
      (document) => {
        logger.debug(`Applied changes to document \`${document.id}\``, {
          userId,
          documentId: document.id,
        });

        send(
          view.renderDocument({
            ...document,
            editing: false,
          }),
        );
      },
      userId,
      projectId,
      actions,
    );
  } else if (action === "apply") {
    send(
      view.renderDocument({
        ...doc!,
        selected: false,
        editing: true,
      }),
    );
    await documents.applyToOne(userId, documentId, actions);
  }

  send(
    view.renderDocumentsList({
      documents: allDocs,
    }),
  );

  send(
    view.renderInstructions({
      instructions: "",
      progress: false,
    }),
  );
}

export async function processIncommingMessage(
  userId: string,
  project: Project,
  command: CommandEnum,
  prompt: string,
) {
  const projectMemory = await getProjectMemory(userId, project.projectId);
  const memories = await projectMemory.memories();
  const workingMemory = await getWorkingMemory(userId);
  const lastUserMemory = memories[memories.length - 1].content;
  let response = "";

  try {
    switch (command) {
      // case "modify_text":
      //   if (command.pageName && command.instructions) {
      //     const files = await markdown.searchFiles(userId, command.pageName);
      //     if (files.length === 0) {
      //       logger.warn(`No file found with name \`${command.pageName}\``, {
      //         userId,
      //       });
      //       response = `No file found with name \`${command.pageName}\``;
      //       break;
      //     }
      //     const result = await markdown.modifyFileContent(
      //       files[0],
      //       command.instructions,
      //     );
      //     logger.info(`Modified the page: ${result.url}`, {
      //       userId,
      //     });
      //     await download.updateDownload(userId, result);
      //     response = await responder.getResponse(
      //       memories,
      //       command,
      //       `Modified page ${command.pageName} based on instructions: ${command.instructions}`,
      //     );
      //   } else {
      //     logger.warn(
      //       `No pageName or instructions provided for modify_text command`,
      //       {
      //         userId,
      //       },
      //     );

      //     response =
      //       "You need to provide both a page name and instructions to modify the text.";
      //   }
      //   break;
      // case "answer_question":
      //   response = await qa.answerQuestion(userId, lastUserMemory);
      //   break;
      // case "download_page":
      //   if (command.pageName) {
      //     try {
      //       const url = await download.prepareForDownload(
      //         userId,
      //         command.pageName,
      //       );
      //       response = `You can download the page \`${command.pageName}\` here: ${url}`;
      //     } catch (error) {
      //       logger.error(`Download page tool failed:`, {
      //         error,
      //         userId,
      //         pageName: command.pageName,
      //       });
      //       response = `Failed to prepare download for page \`${command.pageName}\``;
      //     }
      //   } else {
      //     logger.warn(`No pageName provided for download_page command`, {
      //       userId,
      //     });
      //     response = "You need to provide a page name to download.";
      //   }
      //   break;
      case "none":
        // No action needed
        response = "You need to be more specific.";
        break;
      default:
        logger.warn(`Unknown command: ${command}`, {
          userId,
        });
        response = "You need to be more specific.";
        break;
    }
  } catch (error) {
    logger.error("Failed to process incoming message:", {
      error,
      userId,
      lastUserMessage: lastUserMemory,
      command,
    });
    response = "Sorry, something went wrong while processing your message.";
  }

  return response;
}
