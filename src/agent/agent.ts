import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentStateSchema, type AgentStateType } from "../models/agentState.ts";
import { extractInfoJob } from "./nodes/extractInfoJob.ts";
import { discoveryUserinfo } from "./nodes/discoveryInputs.ts";
import { constructResume } from "./nodes/constructResume.ts";



export function graph() {

  function afterDiscoveryUserInfo(state: AgentStateType) {
    if (state.session?.state === "awaiting_user_info") {
      return END;
    }
    return "extract_info_job";
  }

  function afterExtractInfoJob(state: AgentStateType) {
    if (state.session?.state === "extracting_info_job") {
      return END;
    }

    if (state.session?.profile && state.session?.job) {
      return "construct_resume";
    }

    return END;
  }
  
  const workflow = new StateGraph({stateSchema: AgentStateSchema})
    .addNode("extract_info_job", extractInfoJob)
    .addNode("discovery_user_info", discoveryUserinfo)
    .addNode("construct_resume", constructResume)

    .addEdge(START, "discovery_user_info")

    .addConditionalEdges( "discovery_user_info",afterDiscoveryUserInfo)
    .addConditionalEdges("extract_info_job", afterExtractInfoJob)

    .addEdge("construct_resume", END);


  return workflow.compile();
}
