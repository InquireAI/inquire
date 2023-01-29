export type DustStatus = "succeeded" | "running" | "errored";

export type DustResponse = {
  run: {
    run_id: string;
    created: number;
    run_type: string;
    config: {
      blocks: Record<string, unknown>;
    };
    status: {
      run: DustStatus;
      blocks: [];
    };
    traces: [];
    specification_hash: string;
    results: [
      [
        {
          value: {
            prompt: {
              text: string;
              tokens: [];
              logprobs: number[];
              top_logprobs: number;
            };
            completion: {
              text: string;
              tokens: [];
              logprobs: number[];
              top_logprobs: number;
            };
          };
          error: string;
        }
      ]
    ];
  };
};
