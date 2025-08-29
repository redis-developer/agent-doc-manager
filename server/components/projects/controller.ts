import { RediSearchSchema, SCHEMA_FIELD_TYPE } from "redis";
import logger from "../../utils/log";
import getClient from "../../redis";
import { escapeDashes } from "../../utils/convert";
import { ctrl as orchestrator } from "../orchestrator";

export interface Project {
  projectId: string;
  userId: string;
  title: string;
  prompt: string;
  createdAt?: string;
}

export async function initialize() {
  await createIndexIfNotExists();
}

export async function createIndexIfNotExists() {
  const fileSchema: RediSearchSchema = {
    "$.projectId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "projectId",
    },
    "$.userId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "userId",
    },
    "$.title": {
      type: SCHEMA_FIELD_TYPE.TEXT,
      AS: "title",
    },
    "$.prompt": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "prompt",
    },
  };

  const db = getClient();
  const indexName = "idx-projects";
  try {
    await db.ft.info(indexName);
  } catch (error) {
    await db.ft.create(indexName, fileSchema, {
      ON: "JSON",
      PREFIX: "projects:",
    });
  }
}

export async function create(userId: string) {
  try {
    logger.debug(`Creating new project for user \`${userId}\``, {
      userId,
    });

    const db = getClient();
    const id = crypto.randomUUID();
    const project: Project = {
      projectId: id,
      userId,
      title: "New project",
      prompt: "",
      createdAt: new Date().toISOString(),
    };

    await db.json.set(`projects:${id}`, "$", project as any);

    logger.info(`Created new project \`${id}\` for user \`${userId}\``, {
      projectId: id,
      userId,
    });

    return project;
  } catch (error) {
    logger.error(`Failed to create new project for user \`${userId}\`:`, {
      error,
      userId,
    });
    throw error;
  }
}

export async function update(
  userId: string,
  projectId: string,
  title: string,
  prompt: string,
) {
  const db = getClient();
  const projectKey = `projects:${projectId}`;
  const project = await db.json.get(projectKey, {
    path: "$",
  });

  if (!project) {
    logger.error(`Project \`${projectId}\` not found for user \`${userId}\``, {
      projectId,
      userId,
    });
    throw new Error("Project not found");
  }

  await db.json.set(projectKey, "$.title", title);
  await db.json.set(projectKey, "$.prompt", prompt);
}

export async function all(userId: string) {
  const db = getClient();
  const results = await db.ft.search(
    "idx-projects",
    `@userId:{${escapeDashes(userId)}}`,
    {
      RETURN: ["projectId", "title", "prompt", "createdAt"],
      LIMIT: {
        from: 0,
        size: 100,
      },
    },
  );

  return results.documents.map((doc) => doc.value as unknown as Project);
}

export async function read(userId: string, projectId: string) {
  const db = getClient();
  const projectKey = `projects:${projectId}`;
  let project = await db.json.get(projectKey, {
    path: "$",
  });

  if (Array.isArray(project)) {
    project = project[0];
  }

  if (!project) {
    logger.error(`Project \`${projectId}\` not found for user \`${userId}\``, {
      projectId,
      userId,
    });
    throw new Error("Project not found");
  }

  return project as unknown as Project;
}
