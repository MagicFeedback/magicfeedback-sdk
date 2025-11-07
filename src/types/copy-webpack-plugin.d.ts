declare module 'copy-webpack-plugin' {
  import { Compiler } from 'webpack';
  interface Pattern {
    from: string;
    to: string;
    context?: string;
    globOptions?: any;
    filter?: (resourcePath: string) => boolean;
    noErrorOnMissing?: boolean;
    force?: boolean;
    priority?: number;
  }
  interface Options {
    patterns: Pattern[];
  }
  class CopyWebpackPlugin {
    constructor(options: Options);
    apply(compiler: Compiler): void;
  }
  export = CopyWebpackPlugin;
}

