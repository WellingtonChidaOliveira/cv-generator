import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { graph } from "../../src/agent/agent.ts";
import { makeAgentInput } from "../mock/agentInput.ts";

describe("agent flow", () => {
  const ag = graph();

  it("stops after asking for user information when session is discovering inputs", async () => {
    const result = await ag.invoke({
      ...makeAgentInput()
    });

    assert.equal(result.session?.state, "awaiting_user_info");
    assert.match(result.messages[0].content, /habilidades/i);
  })

  it("stops after asking for job information when profile exists and job is missing", async () => {
    const result = await ag.invoke({
      ...makeAgentInput({
        session: {
          state: "extracting_info_job",
          profile: "user profile",
          job: null,
        }
      })
    });

    assert.equal(result.session?.state, "extracting_info_job");
    assert.match(result.messages[0].content, /vaga/i);
  })

  it("constructs resume when profile and job are already available", async () => {
    const result = await ag.invoke({
      ...makeAgentInput({
        session: {
          state: "ready_to_construct_resume",
          profile: "user profile",
          job: "job info",
        }
      })
    });

    assert.equal(result.session?.state, "resume_constructed");
    assert.match(result.messages[0].content, /Construindo currículo/i);
  })

  it("does not construct resume from an unknown state without required data", async () => {
    const result = await ag.invoke({
      ...makeAgentInput({
        session: {
          state: "some_other_state",
          profile: null,
          job: null,
        }
      })
    });

    assert.notEqual(result.session.state, "resume_constructed");
  })
})
