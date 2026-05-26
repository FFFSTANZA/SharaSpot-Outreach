import { legacyStepsToGraph, validateSequenceGraph } from "../../utils/sequenceValidation";

describe("sequence graph validation", () => {
  it("accepts graph derived from legacy steps", () => {
    const graph = legacyStepsToGraph([
      { subject: "s1", body: "b1", waitDays: 2 },
      { subject: "s2", body: "b2", waitDays: 3 },
    ]);
    expect(graph).toBeDefined();
    const result = validateSequenceGraph(graph!);
    expect(result.valid).toBe(true);
  });

  it("rejects cyclic graphs", () => {
    const result = validateSequenceGraph({
      startNodeId: "n1",
      nodes: [
        { id: "n1", subject: "s1", body: "b1", waitDays: 1 },
        { id: "n2", subject: "s2", body: "b2", waitDays: 1 },
      ],
      edges: {
        n1: { onMatch: "n2", onNoMatch: null },
        n2: { onMatch: "n1", onNoMatch: null },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.message).toContain("acyclic");
  });

  it("rejects graph when startNodeId is not the root", () => {
    const result = validateSequenceGraph({
      startNodeId: "n2",
      nodes: [
        { id: "n1", subject: "s1", body: "b1", waitDays: 1 },
        { id: "n2", subject: "s2", body: "b2", waitDays: 1 },
      ],
      edges: {
        n1: { onMatch: "n2", onNoMatch: null },
      },
    });
    expect(result.valid).toBe(false);
  });
});
