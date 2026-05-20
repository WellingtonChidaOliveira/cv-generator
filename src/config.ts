import process from "node:process";

export type Configs = {
  apiKey: string;
  model: string;
  temperature: number;
  baseUrl: string;
  modelKwargs?: Record<string, unknown>;
};

export const configs: Configs = {
  apiKey: process.env.OPENROUTER_API_KEY || "",
  model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  temperature: 0.7,
  baseUrl: "https://openrouter.ai/api/v1",
  modelKwargs: {
    models: ['nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'],
    provider: {
      sort: {
        by: "throughput",
        partition: "none",
      },
    },
  },
};
