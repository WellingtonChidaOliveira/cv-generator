import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { constructResume } from "../../../src/agent/nodes/constructResume.ts";
import { makeAgentInput } from "../../mock/agentInput.ts";

describe("construct resume node", () => {
  it("constructs resume when profile and job are available", async () => {
    const result = await constructResume(
      makeAgentInput({
        session: {
          state: "ready_to_construct_resume",
          profile: "user profile",
          job: "job info",
        },
      }),
    );

    assert.equal(result.session.state, "resume_constructed");
    assert.match(result.response!, /Construindo currículo/i);
  });

  it("does not construct resume when profile is missing", async () => {
    const result = await constructResume(
      makeAgentInput({
        session: {
          state: "ready_to_construct_resume",
          profile: null,
          job: "job info",
        },
      }),
    );

    assert.notEqual(result.session.state, "resume_constructed");
  });

  it("does not construct resume when job is missing", async () => {
    const result = await constructResume(
      makeAgentInput({
        session: {
          state: "ready_to_construct_resume",
          profile: "user profile",
          job: null,
        },
      }),
    );

    assert.notEqual(result.session.state, "resume_constructed");
  });
});
