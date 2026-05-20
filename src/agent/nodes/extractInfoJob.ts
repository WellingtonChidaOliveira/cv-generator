import type { AgentStateType } from "../../models/agentState";

export async function extractInfoJob(state: AgentStateType) {
  if (state.session?.profile && !state.session?.job) {
    return {
      response: "Necessario link da vaga ou PDF do LinkedIn",
      session: {
        ...state.session,
        state: "extracting_info_job",
      },
    };
  }

  return {
    response: "Continuando sessao.",
    session:{
      ...state.session,
      state: "continuing_session",
    }
  }
}



