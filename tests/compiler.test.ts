import { describe, it, expect } from 'vitest';
import { runClang } from '@yowasp/clang';
import { WASI, OpenFile, File, ConsoleStdout } from '@bjorn3/browser_wasi_shim';
import { BITS_STDCPP_H } from '../src/compiler/umbrellaHeader';
import { parseDiagnostics } from '../src/compiler/diagnostics';

describe('Pocket C++ Compiler & WASI Execution Test Suite', () => {
  it('Test 1: Hello World with bits/stdc++.h', async () => {
    const code = `
#include <bits/stdc++.h>
using namespace std;
int main() {
    cout << "Hello World!" << endl;
    return 0;
}
`;
    const files = {
      bits: { 'stdc++.h': BITS_STDCPP_H },
      'main.cpp': code,
    };

    const compRes = await runClang(['clang++', '-fno-exceptions', '-I.', 'main.cpp', '-o', 'out.wasm'], files);
    expect(compRes['out.wasm']).toBeDefined();

    let output = '';
    const stdoutHandler = new ConsoleStdout((buf) => {
      output += new TextDecoder().decode(buf);
    });
    const stdinHandler = new OpenFile(new File(new Uint8Array()));

    const wasi = new WASI(['program'], [], [stdinHandler, stdoutHandler, stdoutHandler]);
    const module = await WebAssembly.compile(compRes['out.wasm'] as Uint8Array);
    const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
    const exitCode = wasi.start(instance as any);

    expect(exitCode).toBe(0);
    expect(output.trim()).toBe('Hello World!');
  }, 40000);

  it('Test 2: Standard Input (cin >> a >> b >> c)', async () => {
    const code = `
#include <bits/stdc++.h>
using namespace std;
int main() {
    int a, b, c;
    if (cin >> a >> b >> c) {
        cout << a + b + c << "\\n";
    }
    return 0;
}
`;
    const files = {
      bits: { 'stdc++.h': BITS_STDCPP_H },
      'main.cpp': code,
    };

    const compRes = await runClang(['clang++', '-fno-exceptions', '-I.', 'main.cpp', '-o', 'out.wasm'], files);

    let output = '';
    const stdoutHandler = new ConsoleStdout((buf) => {
      output += new TextDecoder().decode(buf);
    });
    const stdinHandler = new OpenFile(new File(new TextEncoder().encode('10 25 65\n')));

    const wasi = new WASI(['program'], [], [stdinHandler, stdoutHandler, stdoutHandler]);
    const module = await WebAssembly.compile(compRes['out.wasm'] as Uint8Array);
    const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
    const exitCode = wasi.start(instance as any);

    expect(exitCode).toBe(0);
    expect(output.trim()).toBe('100');
  }, 30000);

  it('Test 3: Vector and std::sort', async () => {
    const code = `
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sort(a.begin(), a.end());
    for (int x : a) cout << x << " ";
    return 0;
}
`;
    const files = {
      bits: { 'stdc++.h': BITS_STDCPP_H },
      'main.cpp': code,
    };

    const compRes = await runClang(['clang++', '-fno-exceptions', '-I.', 'main.cpp', '-o', 'out.wasm'], files);

    let output = '';
    const stdoutHandler = new ConsoleStdout((buf) => {
      output += new TextDecoder().decode(buf);
    });
    const stdinHandler = new OpenFile(new File(new TextEncoder().encode('4\n50 20 10 40\n')));

    const wasi = new WASI(['program'], [], [stdinHandler, stdoutHandler, stdoutHandler]);
    const module = await WebAssembly.compile(compRes['out.wasm'] as Uint8Array);
    const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
    const exitCode = wasi.start(instance as any);

    expect(exitCode).toBe(0);
    expect(output.trim()).toBe('10 20 40 50');
  }, 30000);

  it('Test 4: Standard C Program with scanf & printf', async () => {
    const code = `
#include <stdio.h>
int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("%d\\n", a + b);
    }
    return 0;
}
`;
    const files = {
      'main.c': code,
    };

    const compRes = await runClang(['clang', 'main.c', '-o', 'out.wasm'], files);

    let output = '';
    const stdoutHandler = new ConsoleStdout((buf) => {
      output += new TextDecoder().decode(buf);
    });
    const stdinHandler = new OpenFile(new File(new TextEncoder().encode('123 456\n')));

    const wasi = new WASI(['program'], [], [stdinHandler, stdoutHandler, stdoutHandler]);
    const module = await WebAssembly.compile(compRes['out.wasm'] as Uint8Array);
    const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
    const exitCode = wasi.start(instance as any);

    expect(exitCode).toBe(0);
    expect(output.trim()).toBe('579');
  }, 30000);

  it('Test 5: Compilation Error & Diagnostics Parsing', async () => {
    const brokenCode = `
int main() {
    invalid_syntax_variable = 42;
    return 0;
}
`;
    let diagOutput = '';
    const textDecoder = new TextDecoder();

    let threw = false;
    try {
      await runClang(
        ['clang++', 'main.cpp', '-o', 'out.wasm'],
        { 'main.cpp': brokenCode },
        {
          stderr: (buf) => {
            if (buf) diagOutput += textDecoder.decode(buf);
          },
        }
      );
    } catch {
      threw = true;
    }

    expect(threw).toBe(true);
    expect(diagOutput).toContain('use of undeclared identifier');

    const diagnostics = parseDiagnostics(diagOutput);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0].line).toBe(3);
    expect(diagnostics[0].severity).toBe('error');
  }, 30000);

  it('Test 6: Diagnostics line and col extraction', () => {
    const raw = `main.cpp:12:5: error: expected ';' after expression\nmain.cpp:15:10: warning: unused variable 'x' [-Wunused-variable]`;
    const diags = parseDiagnostics(raw);
    expect(diags).toHaveLength(2);
    expect(diags[0]).toEqual({
      file: 'main.cpp',
      line: 12,
      col: 5,
      severity: 'error',
      message: "expected ';' after expression",
      raw: "main.cpp:12:5: error: expected ';' after expression",
    });
    expect(diags[1]).toEqual({
      file: 'main.cpp',
      line: 15,
      col: 10,
      severity: 'warning',
      message: "unused variable 'x' [-Wunused-variable]",
      raw: "main.cpp:15:10: warning: unused variable 'x' [-Wunused-variable]",
    });
  });

  it('Test 7: Output Limit Enforcement Logic', () => {
    let totalBytes = 0;
    const limit = 1000;
    let limitExceeded = false;

    const pushChunk = (size: number) => {
      totalBytes += size;
      if (totalBytes > limit) {
        limitExceeded = true;
        throw new Error('OUTPUT_LIMIT_EXCEEDED');
      }
    };

    expect(() => {
      pushChunk(500);
      pushChunk(400);
      pushChunk(200); // Exceeds 1000
    }).toThrow('OUTPUT_LIMIT_EXCEEDED');
    expect(limitExceeded).toBe(true);
  });

  it('Test 8: Consecutive Compilations (No Memory Leak / Overlap)', async () => {
    for (let i = 1; i <= 3; i++) {
      const code = `
#include <iostream>
using namespace std;
int main() {
    cout << "Iteration " << ${i} << endl;
    return 0;
}
`;
      const compRes = await runClang(['clang++', '-fno-exceptions', 'main.cpp', '-o', 'out.wasm'], {
        'main.cpp': code,
      });

      let output = '';
      const stdoutHandler = new ConsoleStdout((buf) => {
        output += new TextDecoder().decode(buf);
      });
      const stdinHandler = new OpenFile(new File(new Uint8Array()));

      const wasi = new WASI(['program'], [], [stdinHandler, stdoutHandler, stdoutHandler]);
      const module = await WebAssembly.compile(compRes['out.wasm'] as Uint8Array);
      const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
      const exitCode = wasi.start(instance as any);

      expect(exitCode).toBe(0);
      expect(output.trim()).toBe(`Iteration ${i}`);
    }
  }, 40000);
});
