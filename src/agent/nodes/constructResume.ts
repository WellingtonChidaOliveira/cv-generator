import type { AgentStateType } from "../../models/agentState.ts";


export async function constructResume(state: AgentStateType) {
    if(state.session?.profile && state.session?.job) {
        return {
            response: "Construindo currículo com as informações fornecidas.",
            session: {
                ...state.session,
                state: "resume_constructed",
            },
        }
    }

    return {
        response: "Continuando sessão.",
        session:{
          ...state.session,
          state: "continuing_session",
        }
    }

}