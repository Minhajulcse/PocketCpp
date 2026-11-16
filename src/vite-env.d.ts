/// <reference types="vite/client" />

declare module '/clang/bundle.js' {
  export const runClang: (args: string[], files: Record<string, any>, options?: any) => Promise<any>;
  export const runLLVM: (utility: string, args: string[], files: Record<string, any>, options?: any) => Promise<any>;
  export const commands: Record<string, any>;
  export class Exit extends Error {
    code: number;
    files: Record<string, any>;
  }
}
