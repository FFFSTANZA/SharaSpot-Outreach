/**
 * Advanced Template Engine for SharaSpot.
 * Supports:
 * - Nested variables: {{company.name}}
 * - Fallbacks: {{name|"there"}}
 * - Conditionals: {{if industry == "tech"}}...{{else}}...{{endif}}
 * - Loops: {{for item in items}}...{{endfor}}
 */

const VAR_PATTERN = /\{\{([a-zA-Z0-9_\.]+)(?:\|"([^"]*)")?\}\}/g;
const IF_PATTERN = /\{\{if\s+([^\}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{endif\}\}/g;
const FOR_PATTERN = /\{\{for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_\.]+)\s*\}\}([\s\S]*?)\{\{endfor\}\}/g;

/**
 * Gets a nested value from an object using a dot-notated path.
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    // Support case-insensitive matching for the first level (columnData compatibility)
    if (current === obj) {
      const lowerKey = Object.keys(current).find(k => k.toLowerCase() === part.toLowerCase());
      current = lowerKey ? current[lowerKey] : undefined;
    } else {
      current = current[part];
    }
  }
  return current;
}

/**
 * Simple rule-based expression evaluator.
 * No AI, just deterministic logic.
 */
function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  condition = condition.trim();
  
  // Equality: var == "value"
  const eqMatch = condition.match(/^([a-zA-Z0-9_\.]+)\s*==\s*"([^"]*)"$/);
  if (eqMatch) {
    const val = getNestedValue(context, eqMatch[1]);
    return String(val) === eqMatch[2];
  }

  // Inequality: var != "value"
  const neqMatch = condition.match(/^([a-zA-Z0-9_\.]+)\s*!=\s*"([^"]*)"$/);
  if (neqMatch) {
    const val = getNestedValue(context, neqMatch[1]);
    return String(val) !== neqMatch[2];
  }

  // Negation: !var
  if (condition.startsWith('!')) {
    return !getNestedValue(context, condition.substring(1).trim());
  }

  // Truthy check: var
  return !!getNestedValue(context, condition);
}

/**
 * Renders a template with the given context.
 */
export function renderTemplate(content: string, context: Record<string, any>): string {
  let rendered = content;

  // 1. Handle Loops: {{for item in items}}...{{endfor}}
  rendered = rendered.replace(FOR_PATTERN, (match, itemName, listPath, body) => {
    const list = getNestedValue(context, listPath);
    if (!Array.isArray(list)) return '';
    return list
      .map((item) => renderTemplate(body, { ...context, [itemName]: item }))
      .join('');
  });

  // 2. Handle Conditionals: {{if cond}}...{{else}}...{{endif}}
  // We use a loop to handle nested conditionals from inside out or just repeatedly
  // since replace with regex doesn't easily handle deep nesting in one pass.
  // For simplicity, we'll assume shallow nesting or handle it via recursion in the evaluator.
  while (IF_PATTERN.test(rendered)) {
    rendered = rendered.replace(IF_PATTERN, (match, condition, trueBody, falseBody) => {
      return evaluateCondition(condition, context)
        ? trueBody
        : (falseBody || '');
    });
  }

  // 3. Handle Variables: {{var}}, {{var.path}}, {{var|"fallback"}}
  rendered = rendered.replace(VAR_PATTERN, (match, path, fallback) => {
    const value = getNestedValue(context, path);
    if (value !== undefined && value !== null) {
      return String(value);
    }
    return fallback !== undefined ? fallback : match;
  });

  return rendered;
}

/**
 * Extracts all unique variable paths from a template.
 */
export function extractVariables(content: string): string[] {
  const variables = new Set<string>();
  
  // Variables
  let match;
  const varRegex = new RegExp(VAR_PATTERN);
  while ((match = varRegex.exec(content)) !== null) {
    variables.add(match[1]);
  }

  // If conditions
  const ifRegex = new RegExp(IF_PATTERN);
  while ((match = ifRegex.exec(content)) !== null) {
    const cond = match[1].trim();
    const parts = cond.split(/\s*==\s*|\s*!=\s*/);
    const varPath = parts[0].startsWith('!') ? parts[0].substring(1).trim() : parts[0].trim();
    if (/^[a-zA-Z0-9_\.]+$/.test(varPath)) {
      variables.add(varPath);
    }
  }

  // For loops
  const forRegex = new RegExp(FOR_PATTERN);
  while ((match = forRegex.exec(content)) !== null) {
    variables.add(match[2]);
  }

  return Array.from(variables);
}
