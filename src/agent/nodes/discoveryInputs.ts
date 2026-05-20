import { AIMessage } from "langchain";
import { z } from "zod/v3";
import type{ AgentStateType } from "../../models/agentState.ts";
import { LLMRouter } from "../../services/llmRouter.ts";
import { configs } from "../../config.ts";

export async function discoveryUserinfo(state:AgentStateType) {
    if(state.session?.state === "discovering_inputs" || state.session?.state) {
        const llm = new LLMRouter(configs);

        const resp = await llm.genereteStructed(
            "Você é um assistente especializado em ajudar os usuários a construir seus currículos. Para isso, você precisa coletar informações sobre a experiência profissional, habilidades, formação acadêmica e outras informações relevantes do usuário. Faça perguntas claras e diretas para obter as informações necessárias. Certifique-se de que o usuário entenda que essas informações serão usadas para criar um currículo personalizado e eficaz.",
            "Quais informações você precisa para começar a construir meu currículo?",
            z.object({
                experience: z.string().describe("Descrição da experiência profissional do usuário"),
                skills: z.string().describe("Lista de habilidades do usuário"),
                education: z.string().describe("Formação acadêmica do usuário"),
                additionalInfo: z.string().describe("Qualquer informação adicional que o usuário queira fornecer")
            })
        );
        return {
            messages:[
                new AIMessage(resp.data ? resp.data : "Não foi possível coletar as informações necessárias.")
            ],
            session: {
                ...state.session,
                state: "awaiting_user_info",
            },
        }
    }

    return {
        ...state
    }
    
}