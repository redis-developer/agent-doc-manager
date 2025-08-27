import {
  RediSearchSchema,
  SCHEMA_FIELD_TYPE,
  SCHEMA_VECTOR_FIELD_ALGORITHM,
  SearchReply,
} from "redis";
import getClient from "../../redis";
import { llm, embedText } from "../../services/ai/ai";
import { randomUlid } from "../../utils/uid";
import { chunkFile, matchPromptToUrl, modifyContent } from "./ai";
import {
  base64ToUrl,
  escapeDashes,
  float32ToBuffer,
  urlToBase64,
} from "../../utils/convert";
import logger from "../../utils/log";

export interface MarkdownFile {
  id: string;
  userId: string;
  url: string;
  content: string;
}

export interface MarkdownFileChunk {
  fileId: string;
  userId: string;
  content: string;
  embedding: number[];
}

export async function initialize() {
  await createIndexIfNotExists();
}

export async function createIndexIfNotExists() {
  const chunkSchema: RediSearchSchema = {
    "$.embedding": {
      type: SCHEMA_FIELD_TYPE.VECTOR,
      TYPE: "FLOAT32",
      ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.HNSW,
      DIM: llm.dimensions,
      DISTANCE_METRIC: "COSINE",
      AS: "embedding",
    },
    "$.fileId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "fileId",
    },
    "$.userId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "userId",
    },
    "$.content": {
      type: SCHEMA_FIELD_TYPE.TEXT,
      AS: "content",
    },
  };
  const fileSchema: RediSearchSchema = {
    "$.id": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "id",
    },
    "$.userId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "userId",
    },
    "$.url": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "url",
    },
    "$.content": {
      type: SCHEMA_FIELD_TYPE.TEXT,
      AS: "content",
    },
  };

  const db = getClient();
  let indexName = "idx-files";
  try {
    await db.ft.info(indexName);
  } catch (error) {
    await db.ft.create(indexName, fileSchema, {
      ON: "JSON",
      PREFIX: "files:",
    });
  }

  indexName = "idx-file-chunks";
  try {
    await db.ft.info(indexName);
  } catch (error) {
    await db.ft.create(indexName, chunkSchema, {
      ON: "JSON",
      PREFIX: "file-chunks:",
    });
  }
}

async function splitFile(file: MarkdownFile): Promise<MarkdownFileChunk[]> {
  const chunkSize = 10;

  logger.info(`Splitting file ${file.url} for user ${file.userId}`);
  const { chunks } = await chunkFile(file.content);
  logger.info(`File split into ${chunks.length} chunks`);

  const allFileChunks: MarkdownFileChunk[] = [];

  for (let i = 0; i < chunks.length; i += chunkSize) {
    const chunkGroup = chunks.slice(i, i + chunkSize);
    const chunkEmbeddings = await Promise.all(
      chunkGroup.map(async (chunk) => {
        return {
          fileId: file.id,
          userId: file.userId,
          content: chunk,
          embedding: await embedText(chunk),
        } as MarkdownFileChunk;
      }),
    );

    allFileChunks.push(...chunkEmbeddings);
  }

  return allFileChunks;
}

export async function addFiles(
  userId: string,
  files: { url: string; content: string }[],
): Promise<MarkdownFile[]> {
  if (files.length === 0) {
    return [];
  }

  const allFiles: MarkdownFile[] = [];
  const allFileChunks: MarkdownFileChunk[] = [];

  for (const file of files) {
    const mdFile = {
      id: randomUlid(),
      userId,
      url: urlToBase64(file.url),
      content: file.content,
    };

    allFiles.push(mdFile);
    allFileChunks.push(...(await splitFile(mdFile)));
  }

  const db = getClient();

  logger.debug(`Setting ${allFiles.length} files for user ${userId} in Redis`);

  await db.json.mSet(
    allFiles.map((file) => {
      return {
        key: `files:${file.id}`,
        path: "$",
        value: {
          ...file,
          url: urlToBase64(file.url),
        } as any,
      };
    }),
  );

  logger.debug(
    `Setting ${allFileChunks.length} file chunks for user ${userId} in Redis`,
  );

  await db.json.mSet(
    allFileChunks.map((chunk) => {
      return {
        key: `file-chunks:${randomUlid()}`,
        path: "$",
        value: chunk as any,
      };
    }),
  );

  return allFiles;
}

export async function addFile(
  userId: string,
  url: string,
  content: string,
): Promise<MarkdownFile> {
  const files = await addFiles(userId, [{ url: urlToBase64(url), content }]);

  return files[0];
}

export async function allFileUrls(userId: string): Promise<string[]> {
  const db = getClient();

  logger.debug(`Fetching all file URLs for user ${userId}`);

  const results = await db.ft.search(
    "idx-files",
    `@userId:{${escapeDashes(userId)}}`,
    {
      RETURN: ["url"],
      LIMIT: {
        from: 0,
        size: 1000,
      },
    },
  );

  const urls = results.documents.map((doc) =>
    base64ToUrl((doc.value as any).url),
  );

  logger.debug(`Found ${urls.length} URLs for user ${userId}`);

  return urls;
}

export async function searchFiles(
  userId: string,
  query: string,
): Promise<MarkdownFile[]> {
  logger.debug(`Searching files for user ${userId} with query: ${query}`);

  const db = getClient();
  const embedding = await embedText(query);

  let results = await db.ft.search(
    "idx-file-chunks",
    `(@userId:{${escapeDashes(userId)}})=>[KNN 100 @embedding $BLOB AS vector_score]`,
    {
      PARAMS: {
        BLOB: float32ToBuffer(embedding),
      },
      RETURN: ["fileId", "vector_score"],
      SORTBY: "vector_score",
      DIALECT: 2,
    },
  );

  if (results.total > 0) {
    const fileIds = Array.from(
      new Set(
        results.documents
          .filter((doc) => {
            return (doc.value as any).vector_score < 0.3;
          })
          .map((doc) => (doc.value as any).fileId),
      ),
    );

    if (fileIds.length > 0) {
      results = await db.ft.search(
        "idx-files",
        `@userId:{${escapeDashes(userId)}} @id:{${escapeDashes(fileIds.join("|"))}}`,
      );
    } else {
      results = {
        total: 0,
        documents: [],
      };
    }
  }

  if (results.total === 0) {
    logger.debug(`No similar files found, falling back to URL matching`);

    const matchedUrl = await matchPromptToUrl(query, await allFileUrls(userId));

    logger.debug(`Matched URL: ${matchedUrl}`);

    if (matchedUrl && matchedUrl.length > 0) {
      results = await db.ft.search(
        "idx-files",
        `@userId:{${escapeDashes(userId)}} @url:{${escapeDashes(urlToBase64(matchedUrl))}}`,
      );
    }
  }

  if (results.total === 0) {
    return [];
  }

  return results.documents.map((doc) => {
    return {
      ...doc.value,
      url: base64ToUrl((doc.value as any).url),
    } as MarkdownFile;
  });
}

export async function getFileByUrl(
  userId: string,
  url: string,
): Promise<MarkdownFile | null> {
  const db = getClient();

  const results = await db.ft.search(
    "idx-files",
    `@userId:{${escapeDashes(userId)}} @url:{${escapeDashes(urlToBase64(url))}}`,
    {
      LIMIT: {
        from: 0,
        size: 1,
      },
    },
  );

  if (results.total === 0) {
    return null;
  }

  return {
    ...results.documents[0].value,
    url: base64ToUrl((results.documents[0].value as any).url),
  } as MarkdownFile;
}

export async function modifyFileContent(file: MarkdownFile, prompt: string) {
  logger.debug(`Modifying content for file ${file.id} with prompt: ${prompt}`);
  const newContent = await modifyContent(file.content, prompt);
  const db = getClient();

  file.content = newContent;

  logger.debug(`Splitting file with new content into chunks for ${file.id}`);

  const chunks = await splitFile(file);
  let existingChunks: SearchReply;

  logger.debug(`Removing existing chunks for file ${file.id}`);
  do {
    existingChunks = await db.ft.search(
      "idx-file-chunks",
      `@fileId:{${escapeDashes(file.id)}}`,
      {
        RETURN: ["fileId"],
        LIMIT: {
          from: 0,
          size: 1000,
        },
      },
    );

    if (existingChunks.total > 0) {
      await db.del(existingChunks.documents.map((doc) => doc.id));
    }
  } while (existingChunks.total > 0);

  logger.debug(`Updating file ${file.id} content in Redis`);

  await db.json.set(`files:${file.id}`, "$", {
    ...file,
    url: urlToBase64(file.url),
  } as any);

  logger.debug(
    `Adding ${chunks.length} new chunks for file ${file.id} in Redis`,
  );

  await db.json.mSet(
    chunks.map((chunk) => {
      return {
        key: `file-chunks:${randomUlid()}`,
        path: "$",
        value: chunk as any,
      };
    }),
  );

  return file;
}
