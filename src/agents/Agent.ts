export abstract class Agent {
  public id: string;
  public name: string;
  public type: 'researcher' | 'analyzer' | 'writer';
  public status: 'idle' | 'working' | 'completed' = 'idle';

  constructor(id: string, name: string, type: 'researcher' | 'analyzer' | 'writer') {
    this.id = id;
    this.name = name;
    this.type = type;
  }

  abstract execute(task: string): Promise<string>;

  setStatus(status: 'idle' | 'working' | 'completed'): void {
    this.status = status;
  }
}
