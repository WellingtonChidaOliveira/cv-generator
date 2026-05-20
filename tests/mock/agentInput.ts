
export function makeAgentInput(overrides = {}) {
  return {
    message: "something",
    response: null,
    ...overrides,
    session: {
      id: "Session-01",
      state: "discovering_inputs",
      job: null,
      profile: null,
      messages: [],
      ...(overrides as any).session
    },
    creation_date: new Date(),
  };
}