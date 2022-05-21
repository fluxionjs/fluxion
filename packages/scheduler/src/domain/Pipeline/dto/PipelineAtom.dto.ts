export interface PipelineAtomCreateDTO {
  parentAtomId?: number;
  pipelineId: number;
  atomId: number;
  creatorId: string;
}

export interface PipelineQueryDTO {
  parentAtomId?: number;
  pipelineId?: number;
  atomId?: number;
}

export interface PipelineAtomUpdateDTO {
  parentAtomId?: number;
}
