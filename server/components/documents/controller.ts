import {
  RediSearchSchema,
  SCHEMA_FIELD_TYPE,
  SCHEMA_VECTOR_FIELD_ALGORITHM,
  SearchReply,
} from "redis";
import getClient from "../../redis";
import { llm, embedText } from "../../services/ai/ai";
import { randomUlid } from "../../utils/uid";
import * as ai from "./ai";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import {
  base64ToUrl,
  escapeDashes,
  float32ToBuffer,
  urlToBase64,
} from "../../utils/convert";
import logger from "../../utils/log";

export interface Document {
  id: string;
  userId: string;
  projectId: string;
  url: string;
  content: string;
}

export interface DocumentChunk {
  documentId: string;
  userId: string;
  projectId: string;
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
    "$.documentId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "documentId",
    },
    "$.userId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "userId",
    },
    "$.projectId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "projectId",
    },
    "$.content": {
      type: SCHEMA_FIELD_TYPE.TEXT,
      AS: "content",
    },
  };
  const documentSchema: RediSearchSchema = {
    "$.id": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "id",
    },
    "$.userId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "userId",
    },
    "$.projectId": {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: "projectId",
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
  let indexName = "idx-documents";
  try {
    await db.ft.info(indexName);
  } catch (error) {
    await db.ft.create(indexName, documentSchema, {
      ON: "JSON",
      PREFIX: "documents:",
    });
  }

  indexName = "idx-document-chunks";
  try {
    await db.ft.info(indexName);
  } catch (error) {
    await db.ft.create(indexName, chunkSchema, {
      ON: "JSON",
      PREFIX: "document-chunks:",
    });
  }
}

async function split(document: Document): Promise<DocumentChunk[]> {
  const chunkSize = 10;

  logger.debug(
    `Splitting document ${document.url} for user ${document.userId}`,
  );
  const splitter = new MarkdownTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 0,
  });
  const chunks = await splitter.splitText(document.content);
  // const { chunks } = await chunkFile(document.content);
  logger.debug(`File split into ${chunks.length} chunks`);

  const allChunks: DocumentChunk[] = [];

  for (let i = 0; i < chunks.length; i += chunkSize) {
    const chunkGroup = chunks.slice(i, i + chunkSize);
    const chunkEmbeddings = await Promise.all(
      chunkGroup.map(async (chunk) => {
        return {
          documentId: document.id,
          userId: document.userId,
          content: chunk,
          embedding: await embedText(chunk),
        } as DocumentChunk;
      }),
    );

    allChunks.push(...chunkEmbeddings);
  }

  return allChunks;
}

export async function createMany(
  userId: string,
  projectId: string,
  documents: { url: string; content: string }[],
): Promise<Document[]> {
  if (documents.length === 0) {
    return [];
  }

  const allDocuments: Document[] = [];
  const allChunks: DocumentChunk[] = [];

  for (const document of documents) {
    const mdFile = {
      id: randomUlid(),
      userId,
      projectId,
      url: document.url,
      content: document.content,
    };

    allDocuments.push(mdFile);
    allChunks.push(...(await split(mdFile)));
  }

  const db = getClient();

  logger.debug(
    `Setting ${allDocuments.length} documents for user ${userId} and project ${projectId} in Redis`,
  );

  await db.json.mSet(
    allDocuments.map((document) => {
      return {
        key: `documents:${document.id}`,
        path: "$",
        value: {
          ...document,
          url: urlToBase64(document.url),
        } as any,
      };
    }),
  );

  logger.debug(
    `Setting ${allChunks.length} document chunks for user ${userId} and project ${projectId} in Redis`,
  );

  await db.json.mSet(
    allChunks.map((chunk) => {
      return {
        key: `document-chunks:${randomUlid()}`,
        path: "$",
        value: chunk as any,
      };
    }),
  );

  return allDocuments;
}

export async function create(
  userId: string,
  projectId: string,
  url: string,
  content: string,
): Promise<Document> {
  const documents = await createMany(userId, projectId, [
    { url: urlToBase64(url), content },
  ]);

  return documents[0];
}

export async function allUrls(
  userId: string,
  projectId: string,
): Promise<string[]> {
  const db = getClient();

  logger.debug(
    `Fetching all document URLs for user ${userId} and project ${projectId}`,
  );

  const results = await db.ft.search(
    "idx-documents",
    `@userId:{${escapeDashes(userId)}} @projectId:{${escapeDashes(projectId)}}`,
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

  logger.debug(
    `Found ${urls.length} URLs for user ${userId} and project ${projectId}`,
  );

  return urls;
}

export async function search(
  userId: string,
  projectId: string,
  query: string,
): Promise<Document[]> {
  logger.debug(
    `Searching documents for user ${userId} and project ${projectId} with query: ${query}`,
  );

  const db = getClient();
  const embedding = await embedText(query);

  let results = await db.ft.search(
    "idx-document-chunks",
    `(@userId:{${escapeDashes(userId)}} @projectId:{${escapeDashes(projectId)}})=>[KNN 100 @embedding $BLOB AS vector_score]`,
    {
      PARAMS: {
        BLOB: float32ToBuffer(embedding),
      },
      RETURN: ["documentId", "vector_score"],
      SORTBY: "vector_score",
      DIALECT: 2,
    },
  );

  if (results.total > 0) {
    const documentIds = Array.from(
      new Set(
        results.documents
          .filter((doc) => {
            return (doc.value as any).vector_score < 0.3;
          })
          .map((doc) => (doc.value as any).documentId),
      ),
    );

    if (documentIds.length > 0) {
      results = await db.ft.search(
        "idx-documents",
        `@userId:{${escapeDashes(userId)}} @id:{${escapeDashes(documentIds.join("|"))}}`,
      );
    } else {
      results = {
        total: 0,
        documents: [],
      };
    }
  }

  if (results.total === 0) {
    logger.debug(`No similar documents found, falling back to URL matching`);

    const matchedUrl = await ai.matchPromptToUrl(
      query,
      await allUrls(userId, projectId),
    );

    logger.debug(`Matched URL: ${matchedUrl}`);

    if (matchedUrl && matchedUrl.length > 0) {
      results = await db.ft.search(
        "idx-documents",
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
    } as Document;
  });
}

export async function all(
  userId: string,
  projectId?: string,
): Promise<Document[]> {
  const db = getClient();

  let search = `@userId:{${escapeDashes(userId)}}`;

  if (projectId && projectId.length > 0) {
    search += ` @projectId:{${escapeDashes(projectId)}}`;
  }

  const results = await db.ft.search("idx-documents", search, {
    LIMIT: {
      from: 0,
      size: 50,
    },
  });

  if (results.total === 0) {
    return [];
  }

  return results.documents.map((doc) => {
    return {
      ...doc.value,
      url: base64ToUrl((doc.value as any).url),
    } as Document;
  });
}

export async function byUrl(
  userId: string,
  projectId: string,
  url: string,
): Promise<Document | null> {
  const db = getClient();

  const results = await db.ft.search(
    "idx-documents",
    `@userId:{${escapeDashes(userId)}} @projectId:{${escapeDashes(projectId)}} @url:{${escapeDashes(urlToBase64(url))}}`,
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
  } as Document;
}

export async function read(
  userId: string,
  documentId: string,
): Promise<Document | null> {
  const db = getClient();
  const documentKey = `documents:${documentId}`;
  let document = await db.json.get(documentKey, {
    path: "$",
  });

  if (Array.isArray(document)) {
    document = document[0];
  }

  if (!document) {
    logger.error(
      `Document \`${documentId}\` not found for user \`${userId}\``,
      {
        documentId,
        userId,
      },
    );
    return null;
  }

  return {
    ...(document as any),
    url: base64ToUrl((document as any).url),
  } as Document;
}

export async function modifyContent(document: Document, prompt: string) {
  logger.debug(
    `Modifying content for document ${document.id} with prompt: ${prompt}`,
  );
  const newContent = await ai.modifyContent(
    document.content,
    prompt,
    document.url,
  );
  const db = getClient();

  document.content = newContent;

  logger.debug(
    `Splitting document with new content into chunks for ${document.id}`,
  );

  const chunks = await split(document);
  let existingChunks: SearchReply;

  logger.debug(`Removing existing chunks for document ${document.id}`);
  do {
    existingChunks = await db.ft.search(
      "idx-document-chunks",
      `@documentId:{${escapeDashes(document.id)}}`,
      {
        RETURN: ["documentId"],
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

  logger.debug(`Updating document ${document.id} content in Redis`);

  await db.json.set(`documents:${document.id}`, "$", {
    ...document,
    url: urlToBase64(document.url),
  } as any);

  logger.debug(
    `Adding ${chunks.length} new chunks for document ${document.id} in Redis`,
  );

  await db.json.mSet(
    chunks.map((chunk) => {
      return {
        key: `document-chunks:${randomUlid()}`,
        path: "$",
        value: chunk as any,
      };
    }),
  );

  return document;
}

export async function diff(
  userId: string,
  documentId: string,
  newContent: string,
) {
  const document = await read(userId, documentId);

  if (!document) {
    throw new Error(`Document not found: ${documentId}`);
  }

  const diffSummary = await ai.getDiffSummary(
    document.content,
    newContent,
    document.url,
  );

  return diffSummary;
}

export async function applyToOne(
  userId: string,
  documentId: string,
  actions: string,
) {
  const document = await read(userId, documentId);
  if (!document) {
    throw new Error(`Document not found: ${documentId}`);
  }

  return modifyContent(document, actions);
}

export async function applyToAll(
  progress: (document: Document) => void,
  userId: string,
  projectId: string,
  actions: string,
) {
  const documents = await all(userId, projectId);

  for (const document of documents) {
    const updatedDocument = await modifyContent(document, actions);
    progress(updatedDocument);
  }
}
