/**
 * Client-side version of the Advanced Template Engine for Previews.
 */

const VAR_PATTERN = /\{\{([a-zA-Z0-9_\.]+)(?:\|"([^"]*)")?\}\}/g;
const IF_PATTERN = /\{\{if\s+([^\}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{endif\}\}/g;
const FOR_PATTERN = /\{\{for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_\.]+)\s*\}\}([\s\S]*?)\{\{endfor\}\}/g;

function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (current === obj) {
      const lowerKey = Object.keys(current).find(k => k.toLowerCase() === part.toLowerCase());
      current = lowerKey ? current[lowerKey] : undefined;
    } else {
      current = current[part];
    }
  }
  return current;
}

function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  condition = condition.trim();
  const eqMatch = condition.match(/^([a-zA-Z0-9_\.]+)\s*==\s*"([^"]*)"$/);
  if (eqMatch) {
    const val = getNestedValue(context, eqMatch[1]);
    return String(val) === eqMatch[2];
  }
  const neqMatch = condition.match(/^([a-zA-Z0-9_\.]+)\s*!=\s*"([^"]*)"$/);
  if (neqMatch) {
    const val = getNestedValue(context, neqMatch[1]);
    return String(val) !== neqMatch[2];
  }
  if (condition.startsWith('!')) {
    return !getNestedValue(context, condition.substring(1).trim());
  }
  return !!getNestedValue(context, condition);
}

export function renderTemplate(content: string, context: Record<string, any>): string {
  let rendered = content;

  // Handle Loops
  rendered = rendered.replace(FOR_PATTERN, (match, itemName, listPath, body) => {
    const list = getNestedValue(context, listPath);
    if (!Array.isArray(list)) return '';
    return list.map((item) => renderTemplate(body, { ...context, [itemName]: item })).join('');
  });

  // Handle Conditionals
  let prev;
  do {
    prev = rendered;
    rendered = rendered.replace(IF_PATTERN, (match, condition, trueBody, falseBody) => {
      return evaluateCondition(condition, context) ? trueBody : (falseBody || '');
    });
  } while (rendered !== prev);

  // Handle Variables
  rendered = rendered.replace(VAR_PATTERN, (match, path, fallback) => {
    const value = getNestedValue(context, path);
    if (value !== undefined && value !== null) return String(value);
    return fallback !== undefined ? fallback : match;
  });

  return rendered;
}

export function extractVariables(content: string): string[] {
  const variables = new Set<string>();
  let match;
  const varRegex = new RegExp(VAR_PATTERN);
  while ((match = varRegex.exec(content)) !== null) variables.add(match[1]);
  const ifRegex = new RegExp(IF_PATTERN);
  while ((match = ifRegex.exec(content)) !== null) {
    const parts = match[1].trim().split(/\s*==\s*|\s*!=\s*/);
    const varPath = parts[0].startsWith('!') ? parts[0].substring(1).trim() : parts[0].trim();
    if (/^[a-zA-Z0-9_\.]+$/.test(varPath)) variables.add(varPath);
  }
  const forRegex = new RegExp(FOR_PATTERN);
  while ((match = forRegex.exec(content)) !== null) variables.add(match[2]);
  return Array.from(variables);
}
