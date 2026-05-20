import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { discoveryUserinfo } from "../../../src/agent/nodes/discoveryInputs.ts";
import { makeAgentInput } from "../../mock/agentInput.ts";


describe("discovery inputs node", () => {

  it("if state in discovery should ask for user info", async () => {
        const res = await discoveryUserinfo(
            {
                ...makeAgentInput({
                    session: {
                        state: "discovering_inputs",
                    }
                })
            }
        )
        assert.equal(res.session.state, "awaiting_user_info");
        assert.match(res.response!, /vaga/i);
        assert.match(res.response!, /habilidades/i);
  })

  it("if state is not discovery should continue session", async () => {
    const res = await discoveryUserinfo(
        {
            ...makeAgentInput({
                session: {
                    state: "extracting_info_job",
                }
            })
        }
    )
    assert.equal(res.session.state, "extracting_info_job");
    // assert.match(res.response!, /Extraindo informações da vaga/i);
  })
})


