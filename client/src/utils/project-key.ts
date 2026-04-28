/** Derives a short uppercase key from a project name, e.g. "New Project" → "NP" */
export function getProjectKey(name: string): string {
  return (
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 5) || "TASK"
  );
}

/** Formats a task code like "NP-42" */
export function getTaskCode(
  projectName: string | undefined | null,
  taskId: string,
): string {
  if (!projectName) return `#${taskId}`;
  return `${getProjectKey(projectName)}-${taskId}`;
}
