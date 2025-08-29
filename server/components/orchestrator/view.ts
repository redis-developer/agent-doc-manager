import Handlebars from "handlebars";
import type { HelperOptions } from "handlebars";
import * as marked from "marked";
import fs from "fs";
import path from "path";
import type { Project } from "../projects";
import type { Document } from "../documents";

/**
 * Checks if two values are equal.
 */
function isEqual(options: HelperOptions) {
  const { a, b } = options.hash;

  return a === b;
}

function ifEqual(options: HelperOptions) {
  const { a, b } = options.hash;

  // @ts-ignore
  return a == b ? options.fn(this) : options.inverse(this);
}

/**
 * Converts markdown text to HTML.
 */
function markdown(options: HelperOptions) {
  const { md } = options.hash;

  return marked.parse(md);
}

Handlebars.registerHelper("markdown", markdown);
Handlebars.registerHelper("isEqual", isEqual);
Handlebars.registerHelper("ifEqual", ifEqual);

const viewsPath = path.join(process.cwd(), "./views/partials");

const projectsTemplate = Handlebars.compile(
  fs.readFileSync(
    path.join(viewsPath, "projects/sidebar/projects.hbs"),
    "utf8",
  ),
);
const newProjectTemplate = Handlebars.compile(
  fs.readFileSync(path.join(viewsPath, "projects/newProject.hbs"), "utf8"),
);
const documentsListTemplate = Handlebars.compile(
  fs.readFileSync(path.join(viewsPath, "projects/documentsList.hbs"), "utf8"),
);
const instructionsTemplate = Handlebars.compile(
  fs.readFileSync(path.join(viewsPath, "projects/instructions.hbs"), "utf8"),
);

/**
 * Renders the project history for the user.
 */
export function renderProjects({
  projects,
  currentProjectId,
}: {
  projects: Array<{ projectId: string; title: string }>;
  currentProjectId: string;
}) {
  return projectsTemplate({
    projects,
    currentProjectId,
  });
}

/**
 * Renders the new project form.
 */
export function renderNewProject(project: Project) {
  return newProjectTemplate(project);
}

/**
 * Renders the document list section.
 */
export function renderDocumentsList({
  documents,
  currentDocumentId,
}: {
  documents: Document[];
  currentDocumentId?: string;
}) {
  return documentsListTemplate({ documents, currentDocumentId });
}

/**
 * Renders the instructions section.
 */
export function renderInstructions({ instructions }: { instructions: string }) {
  return instructionsTemplate({ instructions });
}
