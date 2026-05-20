import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractInfoJob } from "../../../src/agent/nodes/extractInfoJob.ts";
import { makeAgentInput } from "../../mock/agentInput.ts";

describe("extract info job node", () => {
  it("asks for job information when profile exists and job is missing", async () => {
    const result = await extractInfoJob(
      makeAgentInput({
        session: {
          state: "extracting_info_job",
          profile: "user profile",
          job: null,
        },
      }),
    );

    assert.equal(result.session.state, "extracting_info_job");
    assert.match(result.response!, /vaga/i);
  });

  it("does not extract job information when profile is missing", async () => {
    const result = await extractInfoJob(
      makeAgentInput({
        session: {
          state: "extracting_info_job",
          profile: null,
          job: null,
        },
      }),
    );

    assert.notEqual(result.session.state, "extracting_info_job");
  });

  it("does not ask for job information when job already exists", async () => {
    const result = await extractInfoJob(
      makeAgentInput({
        session: {
          state: "extracting_info_job",
          profile: "user profile",
          job: "job info",
        },
      }),
    );

    assert.notEqual(result.session.state, "extracting_info_job");
  });
});
