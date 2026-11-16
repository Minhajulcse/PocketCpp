import React, { useState } from 'react';
import { Plus, Play, Trash2, CheckCircle2, XCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { TestCase } from '../../services/storage';

export interface TestCaseResult {
  testId: string;
  actualOutput: string;
  passed: boolean;
  durationMs: number;
  status: string;
}

interface TestCasesPanelProps {
  testCases: TestCase[];
  onAddTestCase: () => void;
  onUpdateTestCase: (tc: TestCase) => void;
  onDeleteTestCase: (id: string) => void;
  onRunTest: (tc: TestCase) => Promise<TestCaseResult>;
  onRunAll: () => Promise<void>;
  isRunningAll: boolean;
  results: Record<string, TestCaseResult>;
}

export const TestCasesPanel: React.FC<TestCasesPanelProps> = ({
  testCases,
  onAddTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
  onRunTest,
  onRunAll,
  isRunningAll,
  results,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(testCases[0]?.id || null);

  return (
    <div className="flex flex-col h-full bg-ide-panel border border-ide-border rounded-none overflow-hidden">
      {/* Test Cases Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-ide-subpanel border-b border-ide-border select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ide-text">
            Test Cases ({testCases.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddTestCase}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-text transition-colors min-h-[30px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Test</span>
          </button>

          <button
            type="button"
            onClick={onRunAll}
            disabled={isRunningAll || testCases.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-ide-accent hover:bg-ide-accentHover text-white transition-colors disabled:opacity-50 min-h-[30px]"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isRunningAll ? 'Running...' : 'Run All'}</span>
          </button>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {testCases.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-xs">
            No test cases yet. Click "Add Test" to create custom competitive programming tests.
          </div>
        ) : (
          testCases.map((tc, idx) => {
            const isExpanded = expandedId === tc.id;
            const res = results[tc.id];

            return (
              <div
                key={tc.id}
                className="rounded border border-ide-border bg-ide-subpanel overflow-hidden"
              >
                {/* Accordion Bar */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                  className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-ide-hover select-none"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                    <span className="text-xs font-medium text-white">
                      Test #{idx + 1}: {tc.name || `Case ${idx + 1}`}
                    </span>
                    {res && (
                      <span
                        className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          res.passed
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950/60 text-red-400 border border-red-800'
                        }`}
                      >
                        {res.passed ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {res.passed ? 'PASSED' : 'FAILED'} ({(res.durationMs / 1000).toFixed(2)}s)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onRunTest(tc)}
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-ide-panel transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                      title="Run this test case"
                    >
                      <Play className="w-3 h-3 fill-current text-blue-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTestCase(tc.id)}
                      className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-ide-panel transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                      title="Delete test case"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-3 border-t border-ide-border space-y-3 bg-ide-panel">
                    <div>
                      <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                        Input
                      </label>
                      <textarea
                        value={tc.input}
                        onChange={(e) =>
                          onUpdateTestCase({ ...tc, input: e.target.value })
                        }
                        placeholder="Test input..."
                        className="w-full p-2 h-20 bg-ide-subpanel border border-ide-border rounded text-xs font-mono text-zinc-200 resize-none focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                        Expected Output (Optional for Verification)
                      </label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          onUpdateTestCase({ ...tc, expectedOutput: e.target.value })
                        }
                        placeholder="Expected output..."
                        className="w-full p-2 h-16 bg-ide-subpanel border border-ide-border rounded text-xs font-mono text-zinc-200 resize-none focus:outline-none"
                      />
                    </div>

                    {res && (
                      <div>
                        <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                          Actual Output
                        </label>
                        <pre className="w-full p-2 bg-ide-subpanel border border-ide-border rounded text-xs font-mono text-zinc-200 overflow-auto max-h-24">
                          {res.actualOutput || '<No output>'}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
