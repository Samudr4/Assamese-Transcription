
export enum JobStatusEnum {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  COMPLETE = 'Complete',
  FAILED = 'Failed',
}

export interface Job {
  id: string;
  status: JobStatusEnum;
  transcript?: string;
  fileName?: string;
  createdAt: Date;
}

export interface SrtSegment {
  id: number;
  start: string;
  end: string;
  text: string;
}
