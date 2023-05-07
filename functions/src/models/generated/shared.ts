// todo: just import and export shared types from other files
export type ExampleResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: [
    {
      text: string;
      index: number;
      logprobs: null;
      finish_reason: string;
    }
  ];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type OpenaiModel = {
  created: number;
  id: string;
  object: string;
  owned_by: string;
  permission: any[];
  root: string;
};

export type ThreadConfig = {
  model: string;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string[] | string;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: { [key: string]: number };
  user?: string;
};
export type ChatMessageRole = 'system' | 'user' | 'assistant';
export type RequestMessage = {
  role: ChatMessageRole;
  content: string;
  name?: string; // optional name for the user
};
export type ThreadMessage = {
  key?: string;
  tokenCount: number;
} & RequestMessage;
export type ChatCompletionRequest = {
  messages: RequestMessage[];
} & ThreadConfig;

export type FinishReason =
  | 'stop' // API returned complete model output
  | 'length' // Incomplete model output due to max_tokens parameter or token limit
  | 'content_filter' // Omitted content due to a flag from our content filters
  | null; // API response still in progress or incomplete

export type ChatCompletionResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number; // https://platform.openai.com/docs/guides/chat/introduction provides a deep dive on counting tokens
    completion_tokens: number;
    total_tokens: number;
  };
  choices: [
    {
      message: {
        role: ChatMessageRole;
        content: string;
      };
      finish_reason: FinishReason;
      index: number;
    }
  ];
};
