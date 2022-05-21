export interface PipelineCreateDTO {
  name: string;
  description?: string;
  enabled?: boolean;
  creatorId: string;
}

export interface PipelineQueryDTO {
  name?: string;
  enabled?: boolean;
}

export interface PipelineUpdateDTO {
  name?: string;
  description?: string;
  enabled?: boolean;
}
