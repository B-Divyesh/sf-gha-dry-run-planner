import { describe, expect, it } from 'vitest';
import { evaluateExpression, planWorkflow } from './engine';

const event = { name:'pull_request', action:'synchronize', base:'main', head:'feature/x', paths:['src/a.ts'], inputs:{} };

describe('browser planner', () => {
  it('plans trigger filters, matrix cells, steps and needs', () => {
    const plan = planWorkflow(`name: CI
on:
  pull_request:
    branches: [main]
    paths: ['src/**']
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu, windows]
    steps:
      - name: test
        if: matrix.os == 'ubuntu'
        run: npm test
  ship:
    needs: test
    if: github.head_ref == 'main'
    steps: [{ run: echo ship }]
`, event);
    expect(plan.decision.outcome).toBe('run');
    expect(plan.jobs[0].cells).toHaveLength(2);
    expect(plan.jobs[0].cells.map((cell) => cell.steps[0].decision.outcome)).toEqual(['run','skip']);
    expect(plan.jobs[1].decision.outcome).toBe('skip');
  });
  it('reports YAML failures', () => expect(planWorkflow('jobs: [',event).decision.outcome).toBe('error'));
  it('declares unknown context values', () => expect(evaluateExpression("secrets.TOKEN != ''",{}).unknown).toContain('secrets.TOKEN'));
  it('evaluates object filter wildcards', () => expect(evaluateExpression("contains(github.event.pull_request.labels.*.name, 'ready')",{github:{event:{pull_request:{labels:[{name:'ready'},{name:'docs'}]}}}}).value).toBe(true));
  it('runs always() cleanup after a skipped need', () => {
    const plan = planWorkflow(`name: Needs always
on: push
jobs:
  upstream:
    if: false
    steps: [{ run: echo upstream }]
  cleanup:
    needs: upstream
    if: always()
    steps: [{ run: echo cleanup }]
`, { name: 'push', paths: [], inputs: {} });
    expect(plan.jobs.map((job) => job.decision.outcome)).toEqual(['skip', 'run']);
    expect(plan.jobs[1].cells[0].steps[0].decision.outcome).toBe('run');
  });
});
