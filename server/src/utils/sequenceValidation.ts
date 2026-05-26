export interface SequenceStepInput {
  subject: string;
  body: string;
  waitDays: number;
  condition?: string;
  altSubjects?: string[];
  sendHour?: number;
  waitHours?: number;
}

export interface FrequencyCap {
  maxPerRecipient: number;
  maxPerDay: number;
  maxPerWeek: number;
}

export interface SequenceScheduleConfig {
  sendHour: number;
  allowedDaysOfWeek?: number[];
  skipWeekends?: boolean;
  skipHolidays?: boolean;
  timezone?: string;
}

export type RuleOperator = "AND" | "OR";
export type RuleOperandType = "opened" | "clicked" | "replied";

export interface RuleOperand {
  type: RuleOperandType;
  negate?: boolean;
  withinHours?: number;
}

export interface RuleGroup {
  operator: RuleOperator;
  operands?: RuleOperand[];
  groups?: RuleGroup[];
}

export interface BranchEdge {
  onMatch?: string | null;
  onNoMatch?: string | null;
}

export interface SequenceGraphNodeInput {
  id: string;
  subject: string;
  body: string;
  waitDays: number;
  rules?: RuleGroup;
}

export interface SequenceGraphInput {
  startNodeId: string;
  nodes: SequenceGraphNodeInput[];
  edges: Record<string, BranchEdge>;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

const MAX_FOLLOW_UP_STEPS = 10;
const MAX_GRAPH_NODES = 25;

/**
 * Validates an array of follow-up sequence steps.
 * Returns { valid: true } if all steps pass, or { valid: false, message } on first failure.
 * Rejects the entire batch if any step is invalid.
 */
export function validateSequenceSteps(steps: SequenceStepInput[]): ValidationResult {
  if (!Array.isArray(steps)) {
    return { valid: false, message: "Steps must be an array" };
  }

  if (steps.length > MAX_FOLLOW_UP_STEPS) {
    return { valid: false, message: `Maximum of ${MAX_FOLLOW_UP_STEPS} follow-up steps allowed` };
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const label = `Step ${i + 1}`;

    if (!step.subject || typeof step.subject !== "string" || step.subject.trim() === "") {
      return { valid: false, message: `${label}: Subject is required` };
    }

    if (!step.body || typeof step.body !== "string" || step.body.trim() === "") {
      return { valid: false, message: `${label}: Body is required` };
    }

    if (typeof step.waitDays !== "number" || !Number.isInteger(step.waitDays) || step.waitDays < 1 || step.waitDays > 60) {
      return { valid: false, message: `${label}: Wait period must be a whole number between 1 and 60 days` };
    }

    if (step.sendHour !== undefined && (typeof step.sendHour !== "number" || !Number.isInteger(step.sendHour) || step.sendHour < -1 || step.sendHour > 23)) {
      return { valid: false, message: `${label}: Send hour must be between -1 and 23` };
    }

    if (step.waitHours !== undefined && (typeof step.waitHours !== "number" || !Number.isInteger(step.waitHours) || step.waitHours < 0 || step.waitHours > 23)) {
      return { valid: false, message: `${label}: Wait hours must be between 0 and 23` };
    }

    if (step.altSubjects && Array.isArray(step.altSubjects)) {
      if (step.altSubjects.length > 3) {
        return { valid: false, message: `${label}: Maximum of 3 alternate subject lines allowed` };
      }
      for (const alt of step.altSubjects) {
        if (typeof alt !== "string" || alt.trim() === "") {
          return { valid: false, message: `${label}: Alternate subject lines must be non-empty strings` };
        }
      }
    }
  }

  return { valid: true };
}

function validateRuleGroup(group: RuleGroup | undefined): ValidationResult {
  if (!group) return { valid: true };
  if (!["AND", "OR"].includes(group.operator)) {
    return { valid: false, message: "Rule group operator must be AND or OR" };
  }
  const operands = group.operands ?? [];
  const groups = group.groups ?? [];
  if (operands.length === 0 && groups.length === 0) {
    return { valid: false, message: "Rule group cannot be empty" };
  }
  for (const operand of operands) {
    if (!["opened", "clicked", "replied"].includes(operand.type)) {
      return { valid: false, message: `Invalid rule operand type: ${operand.type}` };
    }
    if (operand.withinHours !== undefined && (!Number.isInteger(operand.withinHours) || operand.withinHours < 1)) {
      return { valid: false, message: "Rule operand withinHours must be a positive integer" };
    }
  }
  for (const child of groups) {
    const childResult = validateRuleGroup(child);
    if (!childResult.valid) return childResult;
  }
  return { valid: true };
}

export function validateSequenceGraph(graph: SequenceGraphInput): ValidationResult {
  if (!graph || typeof graph !== "object") return { valid: false, message: "sequenceGraph is required" };
  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) return { valid: false, message: "sequenceGraph.nodes must be a non-empty array" };
  if (graph.nodes.length > MAX_GRAPH_NODES) return { valid: false, message: `Maximum of ${MAX_GRAPH_NODES} graph nodes allowed` };
  if (!graph.startNodeId) return { valid: false, message: "sequenceGraph.startNodeId is required" };

  const nodeIds = new Set<string>();
  for (const node of graph.nodes) {
    if (!node.id || typeof node.id !== "string") return { valid: false, message: "Each graph node must include id" };
    if (nodeIds.has(node.id)) return { valid: false, message: `Duplicate graph node id: ${node.id}` };
    nodeIds.add(node.id);
    const stepResult = validateSequenceSteps([{ subject: node.subject, body: node.body, waitDays: node.waitDays }]);
    if (!stepResult.valid) return stepResult;
    const rulesResult = validateRuleGroup(node.rules);
    if (!rulesResult.valid) return rulesResult;
  }

  if (!nodeIds.has(graph.startNodeId)) return { valid: false, message: "sequenceGraph.startNodeId must reference an existing node" };

  const hasInbound = new Map<string, number>();
  for (const id of nodeIds) hasInbound.set(id, 0);

  for (const [fromId, edge] of Object.entries(graph.edges ?? {})) {
    if (!nodeIds.has(fromId)) return { valid: false, message: `Edge source not found: ${fromId}` };
    for (const toId of [edge?.onMatch, edge?.onNoMatch]) {
      if (!toId) continue;
      if (!nodeIds.has(toId)) return { valid: false, message: `Edge target not found: ${toId}` };
      hasInbound.set(toId, (hasInbound.get(toId) ?? 0) + 1);
    }
  }

  for (const [nodeId, inboundCount] of hasInbound.entries()) {
    if (nodeId === graph.startNodeId) continue;
    if (inboundCount === 0) return { valid: false, message: `Orphan graph node detected: ${nodeId}` };
  }
  const rootNodes = Array.from(hasInbound.entries()).filter(([_, inboundCount]) => inboundCount === 0).map(([id]) => id);
  if (rootNodes.length === 1 && rootNodes[0] !== graph.startNodeId) {
    return { valid: false, message: "sequenceGraph.startNodeId must be the only root node" };
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const dfs = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    const edge = graph.edges?.[nodeId];
    const next = [edge?.onMatch, edge?.onNoMatch].filter(Boolean) as string[];
    for (const child of next) {
      if (dfs(child)) return true;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };
  if (dfs(graph.startNodeId)) return { valid: false, message: "sequenceGraph must be acyclic" };

  return { valid: true };
}

export function legacyStepsToGraph(steps: SequenceStepInput[]): SequenceGraphInput | undefined {
  if (!steps.length) return undefined;
  const nodes = steps.map((s, idx) => ({ id: `n${idx + 1}`, subject: s.subject, body: s.body, waitDays: s.waitDays }));
  const edges: Record<string, BranchEdge> = {};
  for (let i = 0; i < nodes.length; i++) {
    const next = nodes[i + 1]?.id ?? null;
    edges[nodes[i].id] = { onMatch: next, onNoMatch: null };
  }
  return { startNodeId: nodes[0].id, nodes, edges };
}
