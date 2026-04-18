export interface D1Results<T> {
  results?: T[];
}

export interface D1RunMeta {
  changes?: number;
}

export interface D1RunResult {
  meta?: D1RunMeta;
}
