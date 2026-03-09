export class Config {
    private variables: Record<string, any>;

    constructor() {
      this.variables = {};

      this.variables["env"] = 'prod';
      this.variables["debug"] = false;
      this.variables["dryRun"] = false;
    }

    public get<T>(key: string): T | undefined {
      return this.variables[key];
    }

    public set<T>(key: string, value: T): void {
      this.variables[key] = value;
    }
  }
