import {z} from "zod/v3";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage, providerStrategy, SystemMessage } from "langchain";
import { Configs } from "../config";


export class LLMRouter {
  private config: Configs;
  private llmClient: ChatOpenAI;

  constructor(config: Configs) {
    this.config = config;
    this.llmClient = new ChatOpenAI({
      apiKey: this.config.apiKey,
      modelName: this.config.model,
      temperature: this.config.temperature,
      configuration: {
        baseURL: this.config.baseUrl,
      },
      modelKwargs: this.config.modelKwargs,
    });
  }


  async genereteStructed<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodSchema<T>
  ){
    try {
        const agent = createAgent({
            model: this.llmClient,
            tools: [],
            responseFormat: providerStrategy(schema)
        })

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]

        const data = await agent.invoke({messages});
        return {
            success: true,
            data: data.structuredResponse
        }
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : String(error)
        }
    }
  }
}