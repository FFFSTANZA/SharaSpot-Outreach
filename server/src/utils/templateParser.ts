import { renderTemplate, extractVariables } from "./templateEngine";

/**
 * Extracts all unique variable names from a template string.
 * Returns an empty array if no variables are found.
 */
export function parseVariables(content: string): string[] {
  return extractVariables(content);
}

/**
 * Substitutes {{variable_name}} tokens in content with values from the provided map.
 * Now supports advanced logic: conditionals, fallbacks, nested paths.
 */
export function resolveVariables(
  content: string,
  variables: Record<string, any>
): string {
  return renderTemplate(content, variables);
}

/**
 * Serializes template content back to its stored format.
 * Identity operation — preserves all {{variable}} tokens and HTML structure.
 * Exists to formalize the round-trip property: print(parse(template)) === template.
 */
export function printTemplate(content: string): string {
  return content;
}
