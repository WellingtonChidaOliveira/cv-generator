import { MessagesZodMeta } from '@langchain/langgraph';
import { withLangGraph } from '@langchain/langgraph/zod';
import { BaseMessage } from '@langchain/core/messages';
import { z } from 'zod/v3'


export const AgentStateSchema = z.object({
  // id: z.string().describe("id for chat history"),
  messages: withLangGraph(
    z.custom<BaseMessage[]>(),
    MessagesZodMeta
  ),
  session: z.object({
    id: z.string().describe("id for session is the same from history").optional(),
    state: z.string().default("discovering_inputs").describe("currently state for session").optional(),
    job: z.unknown().nullable().optional(),
    profile: z.unknown().nullable().optional(),
    messages: z.string().array().describe("history for messages session").optional(),
  }).optional(),
  creation_date: z.date().describe("create date schema").optional()
});

export type AgentStateType = z.infer<typeof AgentStateSchema>;

