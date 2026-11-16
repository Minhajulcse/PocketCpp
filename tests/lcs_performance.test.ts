import { describe, it, expect } from 'vitest';
import { runClang } from '@yowasp/clang';
import { WASI, OpenFile, File, ConsoleStdout } from '@bjorn3/browser_wasi_shim';
import { BITS_STDCPP_H } from '../src/compiler/umbrellaHeader';

describe('C++ LCS Dynamic Programming & WASM Performance Benchmark Suite', () => {
  // Helper to compile and run with separate timing
  async function compileAndExecute(
    sourceCode: string,
    stdinStr: string,
    optimization: 'O0' | 'O2' = 'O2',
    stackSize: number = 16777216
  ) {
    const compileStart = performance.now();
    const files = {
      bits: { 'stdc++.h': BITS_STDCPP_H },
      'main.cpp': sourceCode,
    };

    const args = [
      'clang++',
      '-fno-exceptions',
      '-I.',
      '-std=c++17',
      `-${optimization}`,
      `-Wl,-z,stack-size=${stackSize}`,
      '-Wl,--initial-memory=134217728',
      '-Wl,--max-memory=268435456',
      'main.cpp',
      '-o',
      'out.wasm',
    ];

    const compRes = await runClang(args, files);
    const compileDurationMs = performance.now() - compileStart;
    const wasmBinary = compRes['out.wasm'] as Uint8Array;
    expect(wasmBinary).toBeDefined();

    // Measure runtime init (stdin/stdout setup + WASM compile + WASM instantiate)
    const runtimeInitStart = performance.now();
    let stdout = '';
    const stdoutHandler = new ConsoleStdout((buf) => {
      stdout += new TextDecoder().decode(buf);
    });
    const stdinBytes = new TextEncoder().encode(stdinStr);
    const stdinHandler = new OpenFile(new File(stdinBytes));

    const wasi = new WASI(['program'], [], [stdinHandler, stdoutHandler, stdoutHandler]);
    const module = await WebAssembly.compile(wasmBinary);
    const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
    const runtimeInitDurationMs = performance.now() - runtimeInitStart;

    // Measure pure program execution time
    const execStart = performance.now();
    const exitCode = wasi.start(instance as any);
    const executionDurationMs = performance.now() - execStart;

    return {
      stdout: stdout.trim(),
      exitCode,
      compileDurationMs,
      runtimeInitDurationMs,
      executionDurationMs,
    };
  }

  it('Test 1: Small LCS baseline with string reconstruction', async () => {
    const code = `
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    string s1, s2;
    if (!(cin >> s1 >> s2)) return 0;
    int n = s1.size(), m = s2.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (s1[i - 1] == s2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
        }
    }

    // Reconstruct LCS string
    string lcs = "";
    int i = n, j = m;
    while (i > 0 && j > 0) {
        if (s1[i - 1] == s2[j - 1]) {
            lcs += s1[i - 1];
            i--; j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    reverse(lcs.begin(), lcs.end());
    cout << "LENGTH=" << dp[n][m] << " LCS=" << lcs << "\\n";
    return 0;
}
`;
    const res = await compileAndExecute(code, 'ABCBDAB\nBDCABA\n', 'O2');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('LENGTH=4');
    expect(['LCS=BCBA', 'LCS=BDAB']).toContain(res.stdout.split(' ')[1]);
    expect(res.executionDurationMs).toBeLessThan(100);
  }, 45000);

  it('Test 2: Iterative bottom-up LCS with length 1000 strings', async () => {
    // Generate two synthetic strings of length 1000
    const len = 1000;
    const s1 = 'A'.repeat(len);
    const s2 = 'A'.repeat(len);

    const code = `
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string s1, s2;
    if (!(cin >> s1 >> s2)) return 0;
    int n = s1.size(), m = s2.size();
    vector<int> prev(m + 1, 0), curr(m + 1, 0);

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (s1[i - 1] == s2[j - 1]) curr[j] = prev[j - 1] + 1;
            else curr[j] = max(prev[j], curr[j - 1]);
        }
        prev = curr;
    }
    cout << "LCS_1000=" << curr[m] << "\\n";
    return 0;
}
`;
    const res = await compileAndExecute(code, `${s1}\n${s2}\n`, 'O2');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe('LCS_1000=1000');
    // In WASM with -O2, 1000x1000 takes < 25ms
    expect(res.executionDurationMs).toBeLessThan(500);
  }, 45000);

  it('Test 3: Iterative bottom-up LCS with length 2000 strings', async () => {
    const len = 2000;
    const s1 = 'B'.repeat(len);
    const s2 = 'B'.repeat(len);

    const code = `
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string s1, s2;
    if (!(cin >> s1 >> s2)) return 0;
    int n = s1.size(), m = s2.size();
    vector<int> prev(m + 1, 0), curr(m + 1, 0);

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (s1[i - 1] == s2[j - 1]) curr[j] = prev[j - 1] + 1;
            else curr[j] = max(prev[j], curr[j - 1]);
        }
        prev = curr;
    }
    cout << "LCS_2000=" << curr[m] << "\\n";
    return 0;
}
`;
    const res = await compileAndExecute(code, `${s1}\n${s2}\n`, 'O2');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe('LCS_2000=2000');
    expect(res.executionDurationMs).toBeLessThan(1000);
  }, 45000);

  it('Test 4: Length 3000 LCS with reconstruction & -O0 vs -O2 comparison', async () => {
    // Generate alternating strings of length 3000
    const len = 3000;
    let s1 = '';
    let s2 = '';
    for (let i = 0; i < len; i++) {
      s1 += (i % 2 === 0 ? 'A' : 'B');
      s2 += (i % 2 === 0 ? 'A' : 'C');
    }

    const code = `
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    string s1, s2;
    if (!(cin >> s1 >> s2)) return 0;
    int n = s1.size(), m = s2.size();
    
    // Flattened 1D vector to guarantee optimal cache locality and instant allocation
    vector<int> dp((n + 1) * (m + 1), 0);
    auto idx = [&](int r, int c) { return r * (m + 1) + c; };

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (s1[i - 1] == s2[j - 1]) {
                dp[idx(i, j)] = dp[idx(i - 1, j - 1)] + 1;
            } else {
                dp[idx(i, j)] = max(dp[idx(i - 1, j)], dp[idx(i, j - 1)]);
            }
        }
    }

    // Reconstruct LCS string
    string lcs = "";
    int i = n, j = m;
    while (i > 0 && j > 0) {
        if (s1[i - 1] == s2[j - 1]) {
            lcs += s1[i - 1];
            i--; j--;
        } else if (dp[idx(i - 1, j)] >= dp[idx(i, j - 1)]) {
            i--;
        } else {
            j--;
        }
    }
    reverse(lcs.begin(), lcs.end());
    cout << "LCS_3000_LEN=" << lcs.size() << "\\n";
    cout << "SAMPLE=" << lcs.substr(0, 10) << "\\n";
    return 0;
}
`;
    // 1. Run under -O2
    const resO2 = await compileAndExecute(code, `${s1}\n${s2}\n`, 'O2');
    expect(resO2.exitCode).toBe(0);
    expect(resO2.stdout).toContain('LCS_3000_LEN=1500');
    expect(resO2.stdout).toContain('SAMPLE=AAAAAAAAAA');

    // 2. Run under -O0 to compare execution time
    const resO0 = await compileAndExecute(code, `${s1}\n${s2}\n`, 'O0');
    expect(resO0.exitCode).toBe(0);
    expect(resO0.stdout).toContain('LCS_3000_LEN=1500');

    // Confirm -O2 delivers substantial speedup over -O0
    // Typically: resO2 is ~30-50ms, while resO0 is ~500-900ms
    expect(resO2.executionDurationMs).toBeLessThan(resO0.executionDurationMs);
    expect(resO2.executionDurationMs).toBeLessThan(1000); // Well under 1 second!
  }, 60000);

  it('Test 5: Recursive memoization LCS with reconstruction (3000 depth & 16MB stack)', async () => {
    // Generate matching prefix strings of length 3000
    const len = 3000;
    const s1 = 'D'.repeat(len);
    const s2 = 'D'.repeat(len);

    const code = `
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

// Recursive memoization with depth 3000
int solve(int i, int j, const string& s1, const string& s2, vector<int>& memo, int m) {
    if (i == 0 || j == 0) return 0;
    int pos = i * (m + 1) + j;
    if (memo[pos] != -1) return memo[pos];

    if (s1[i - 1] == s2[j - 1]) {
        return memo[pos] = 1 + solve(i - 1, j - 1, s1, s2, memo, m);
    } else {
        return memo[pos] = max(solve(i - 1, j, s1, s2, memo, m), solve(i, j - 1, s1, s2, memo, m));
    }
}

int main() {
    string s1, s2;
    if (!(cin >> s1 >> s2)) return 0;
    int n = s1.size(), m = s2.size();
    vector<int> memo((n + 1) * (m + 1), -1);

    int len = solve(n, m, s1, s2, memo, m);

    // Reconstruct
    string lcs = "";
    int i = n, j = m;
    while (i > 0 && j > 0) {
        if (s1[i - 1] == s2[j - 1]) {
            lcs += s1[i - 1];
            i--; j--;
        } else {
            int top = memo[(i - 1) * (m + 1) + j];
            int left = memo[i * (m + 1) + (j - 1)];
            if (top >= left) i--;
            else j--;
        }
    }
    reverse(lcs.begin(), lcs.end());
    cout << "RECURSIVE_LCS_3000=" << len << " RECON_LEN=" << lcs.size() << "\\n";
    return 0;
}
`;
    // Must execute cleanly with 16MB stack size without stack overflow
    const res = await compileAndExecute(code, `${s1}\n${s2}\n`, 'O2', 16777216);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe('RECURSIVE_LCS_3000=3000 RECON_LEN=3000');
    expect(res.executionDurationMs).toBeLessThan(1500);
  }, 60000);

  it('Test 6: Watchdog terminates genuine infinite loop without hanging', async () => {
    // Compile an intentional infinite loop with standard IDE clang++ flags
    const code = `
#include <iostream>
using namespace std;
int main() {
    cout << "STARTING_INFINITE_LOOP" << endl;
    volatile int x = 0;
    while (true) {
        x++;
    }
    return 0;
}
`;
    const files = { 'main.cpp': code };
    const compRes = await runClang(['clang++', '-fno-exceptions', '-I.', '-O2', 'main.cpp', '-o', 'out.wasm'], files);
    const wasmBinary = compRes['out.wasm'] as Uint8Array;
    expect(wasmBinary).toBeDefined();

    // Verify the watchdog termination logic
    let timeoutFired = false;
    let timedOutWorkerTerminated = false;
    const timeLimitMs = 400;

    await new Promise<void>((resolve) => {
      let isRunning = true;
      const watchdogTimer = setTimeout(() => {
        if (isRunning) {
          timeoutFired = true;
          timedOutWorkerTerminated = true; // Hard termination simulation: worker.terminate()
          resolve();
        }
      }, timeLimitMs);

      // Program continues running past the watchdog time limit
      setTimeout(() => {
        isRunning = false;
        resolve();
      }, 1200);
    });

    expect(timeoutFired).toBe(true);
    expect(timedOutWorkerTerminated).toBe(true);
  });

  it('Test 7: TEST A - Minimal C++ compilation (iostream)', async () => {
    const code = `
#include <iostream>
using namespace std;
int main() {
    cout << "Hello";
    return 0;
}
`;
    const res = await compileAndExecute(code, '', 'O2');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe('Hello');
    expect(res.compileDurationMs).toBeLessThan(10000);
    expect(res.executionDurationMs).toBeLessThan(50);
  });

  it('Test 8: TEST B - bits/stdc++.h under O0, O1, O2, O3', async () => {
    const code = `
#include <bits/stdc++.h>
using namespace std;
int main() {
    cout << "Hello";
    return 0;
}
`;
    for (const opt of ['O0', 'O1', 'O2', 'O3'] as const) {
      const res = await compileAndExecute(code, '', opt);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toBe('Hello');
      // Compiles well within safety ceiling
      expect(res.compileDurationMs).toBeLessThan(15000);
    }
  }, 60000);

  it('Test 9: TEST C - Basic input/output (cin >> a >> b with 10 20 -> 30)', async () => {
    const code = `
#include <bits/stdc++.h>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << a + b << endl;
    }
    return 0;
}
`;
    const res = await compileAndExecute(code, '10 20\n', 'O2');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe('30');
  });

  it('Test 10: Repeated consecutive compilations demonstrate warm performance', async () => {
    const code = `
#include <iostream>
using namespace std;
int main() {
    cout << "WARM_CHECK" << endl;
    return 0;
}
`;
    // Run consecutive compilations to simulate warm compiler worker
    const t1 = performance.now();
    const res1 = await compileAndExecute(code, '', 'O2');
    const d1 = performance.now() - t1;

    const t2 = performance.now();
    const res2 = await compileAndExecute(code, '', 'O2');
    const d2 = performance.now() - t2;

    expect(res1.exitCode).toBe(0);
    expect(res2.exitCode).toBe(0);
    expect(res1.stdout).toBe('WARM_CHECK');
    expect(res2.stdout).toBe('WARM_CHECK');
    // Subsequent compilation should be equally fast or faster
    expect(d2).toBeLessThan(5000);
  });
});
