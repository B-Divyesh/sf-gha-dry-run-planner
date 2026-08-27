import { load } from 'js-yaml';

export type Outcome = 'run' | 'skip' | 'unknown' | 'error';
export interface Decision { outcome: Outcome; reason: string; value?: unknown }
export interface SyntheticEvent { name: string; action?: string; base?: string; head?: string; paths: string[]; labels?: string[]; inputs: Record<string, unknown> }
export interface StepPlan { name: string; decision: Decision; run?: string; uses?: string }
export interface MatrixPlan { values: Record<string, unknown>; steps: StepPlan[] }
export interface JobPlan { id: string; name: string; needs: string[]; decision: Decision; cells: MatrixPlan[] }
export interface BrowserPlan { name: string; decision: Decision; jobs: JobPlan[]; secrets: string[]; permissions: string[]; warnings: string[] }

type Obj = Record<string, any>;
type Token = { type: string; value?: string | number };

export function planWorkflow(source: string, event: SyntheticEvent): BrowserPlan {
  let workflow: Obj;
  try {
    const parsed = load(source);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('The workflow root must be a mapping.');
    workflow = parsed as Obj;
  } catch (error) {
    return { name: 'Invalid workflow', decision: decision('error', error instanceof Error ? error.message : 'YAML could not be parsed.'), jobs: [], secrets: [], permissions: [], warnings: [] };
  }
  const trigger = triggerDecision(workflow.on, event);
  const results: Record<string, string> = {};
  const jobs: JobPlan[] = [];
  const entries = Object.entries(workflow.jobs ?? {});
  const ordered = topoSort(entries);
  if (trigger.outcome === 'run' || trigger.outcome === 'unknown') {
    for (const [id, raw] of ordered) {
      const job = raw as Obj;
      const needs = list(job.needs);
      const blocked = needs.find((need) => results[need] !== 'success');
      const context = makeContext(workflow, event, {}, results);
      const jobDecision = blocked ? decision('skip', `Dependency ${blocked} did not succeed.`) : expressionDecision(job.if ?? 'success()', context, 'Job if');
      const cells: MatrixPlan[] = [];
      if (jobDecision.outcome === 'run' || jobDecision.outcome === 'unknown') {
        const matrices = expandMatrix(job.strategy?.matrix);
        for (const values of matrices) {
          const cellContext = makeContext(workflow, event, values, results);
          const steps = list<Obj>(job.steps).map((step, index) => ({
            name: step.name ?? step.uses ?? String(step.run ?? '').split('\n')[0] ?? `Step ${index + 1}`,
            decision: expressionDecision(step.if ?? 'success()', cellContext, 'Step if'),
            run: step.run ? resolveTemplates(String(step.run), cellContext) : undefined,
            uses: step.uses,
          }));
          cells.push({ values, steps });
        }
      }
      results[id] = jobDecision.outcome === 'run' ? 'success' : 'skipped';
      jobs.push({ id, name: job.name ?? id, needs, decision: jobDecision, cells });
    }
  }
  const secretMatches = [...source.matchAll(/secrets(?:\.|\[['"])([A-Za-z_][A-Za-z0-9_]*)/gi)].map((m) => m[1].toUpperCase());
  const permissions = workflow.permissions ? typeof workflow.permissions === 'string' ? [workflow.permissions] : Object.entries(workflow.permissions).map(([key, value]) => `${key}: ${value}`) : [];
  const warnings = [
    ...(secretMatches.length ? ['Secret values stay unknown; only references are reported.'] : []),
    ...(workflow.concurrency ? ['Live concurrency state is unavailable locally.'] : []),
    ...(event.name === 'workflow_run' ? ['workflow_run payload semantics are only partially modeled.'] : []),
  ];
  return { name: workflow.name ?? 'Untitled workflow', decision: trigger, jobs, secrets: [...new Set(secretMatches)].sort(), permissions, warnings };
}

function triggerDecision(on: unknown, event: SyntheticEvent): Decision {
  if (!on) return decision('error', "Missing an 'on' trigger.");
  if (typeof on === 'string') return on === event.name ? decision('run', `Event matches ${on}.`) : decision('skip', `Listens for ${on}, not ${event.name}.`);
  if (Array.isArray(on)) return on.includes(event.name) ? decision('run', `${event.name} is listed.`) : decision('skip', `${event.name} is not in the event list.`);
  const config = (on as Obj)[event.name];
  if (config === undefined) return decision('skip', `Workflow does not listen for ${event.name}.`);
  if (!config || typeof config !== 'object') return decision('run', `Event ${event.name} matches.`);
  if (config.types && !list(config.types).includes(event.action ?? '')) return event.action ? decision('skip', `Action ${event.action} is excluded by types.`) : decision('unknown', 'An event action is needed for the types filter.');
  const branch = event.name.startsWith('pull_request') ? event.base : event.head;
  if (config.branches && !branch) return decision('unknown', 'A base/head branch is needed for branch filters.');
  if (config.branches && !matchesPatterns(branch!, list(config.branches), false)) return decision('skip', `Branch ${branch} did not match branches.`);
  if (config['branches-ignore'] && branch && matchesPatterns(branch, list(config['branches-ignore']), false)) return decision('skip', `Branch ${branch} matched branches-ignore.`);
  if (config.paths) {
    if (!event.paths.length) return decision('skip', 'No changed paths were supplied for the paths filter.');
    if (!event.paths.some((path) => matchesPatterns(path, list(config.paths), false))) return decision('skip', 'No changed path matched paths.');
  }
  if (config['paths-ignore'] && event.paths.length && event.paths.every((path) => matchesPatterns(path, list(config['paths-ignore']), false))) return decision('skip', 'Every changed path matched paths-ignore.');
  return decision('run', `${event.name} matched all configured trigger filters.`);
}

function expressionDecision(source: unknown, context: Obj, label: string): Decision {
  const result = evaluateExpression(String(source), context);
  if (result.unknown) return decision('unknown', result.unknown);
  if (result.error) return decision('error', result.error);
  return truthy(result.value) ? decision('run', `${label} evaluated to true.`, result.value) : decision('skip', `${label} evaluated to false.`, result.value);
}

export function evaluateExpression(raw: string, context: Obj): { value?: unknown; unknown?: string; error?: string } {
  const source = raw.trim().replace(/^\$\{\{\s*/, '').replace(/\s*\}\}$/, '');
  try { return { value: new ExpressionParser(tokenize(source), context).parse() }; }
  catch (error) { const message = error instanceof Error ? error.message : String(error); return message.startsWith('Unknown:') ? { unknown: message.slice(8) } : { error: message }; }
}

class ExpressionParser {
  private index = 0;
  constructor(private tokens: Token[], private context: Obj) {}
  parse(): unknown { const value = this.or(); if (this.peek().type !== 'end') throw new Error(`Unexpected token ${this.peek().type}.`); return value }
  private or(): unknown { let value = this.and(); while (this.take('or')) { const right = this.and(); value = truthy(value) || truthy(right) } return value }
  private and(): unknown { let value = this.compare(); while (this.take('and')) { const right = this.compare(); value = truthy(value) && truthy(right) } return value }
  private compare(): unknown { let left = this.unary(); const op = this.peek().type; if (!['eq','ne','gt','ge','lt','le'].includes(op)) return left; this.index++; const right = this.unary(); const a = coerce(left), b = coerce(right); switch (op) { case 'eq': return eq(left,right); case 'ne': return !eq(left,right); case 'gt': return a > b; case 'ge': return a >= b; case 'lt': return a < b; default: return a <= b } }
  private unary(): unknown { if (this.take('not')) return !truthy(this.unary()); return this.primary() }
  private primary(): unknown {
    const token = this.tokens[this.index++];
    if (token.type === 'string' || token.type === 'number' || token.type === 'boolean' || token.type === 'null') return token.value ?? null;
    if (token.type === 'lparen') { const value = this.or(); this.expect('rparen'); return value }
    if (token.type !== 'ident') throw new Error(`Expected a value, found ${token.type}.`);
    const name = String(token.value);
    if (this.take('lparen')) { const args: unknown[] = []; if (this.peek().type !== 'rparen') do { args.push(this.or()) } while (this.take('comma')); this.expect('rparen'); return callFunction(name,args) }
    const path = [name];
    while (this.take('dot')) { const part = this.tokens[this.index++]; if (part.type !== 'ident') throw new Error('Expected a property name.'); path.push(String(part.value)) }
    let value: any = this.context;
    for (const part of path) {
      if (Array.isArray(value) && part === '*') continue;
      if (Array.isArray(value) && !/^\d+$/.test(part)) {
        const projected = value.flatMap((item) => item && typeof item === 'object' && part in item ? [item[part]] : []);
        if (!projected.length) throw new Error(`Unknown:${path.join('.')} is not declared in this synthetic event.`);
        value = projected;
        continue;
      }
      if (value == null || !(part in Object(value))) throw new Error(`Unknown:${path.join('.')} is not declared in this synthetic event.`);
      value = value[part];
    }
    return value;
  }
  private peek() { return this.tokens[this.index] }
  private take(type: string) { if (this.peek().type === type) { this.index++; return true } return false }
  private expect(type: string) { if (!this.take(type)) throw new Error(`Expected ${type}.`) }
}

function tokenize(source: string): Token[] {
  const out: Token[] = []; let i = 0;
  while (i < source.length) {
    if (/\s/.test(source[i])) { i++; continue }
    const two = source.slice(i,i+2); const ops: Record<string,string> = {'==':'eq','!=':'ne','>=':'ge','<=':'le','&&':'and','||':'or'};
    if (ops[two]) { out.push({type:ops[two]}); i += 2; continue }
    const singles: Record<string,string> = {'>':'gt','<':'lt','!':'not','(':'lparen',')':'rparen',',':'comma','.':'dot'};
    if (singles[source[i]]) { out.push({type:singles[source[i++]]}); continue }
    if (source[i] === "'" || source[i] === '"') { const quote = source[i++]; let value = ''; while (i < source.length && source[i] !== quote) { value += source[i] === '\\' && i + 1 < source.length ? source[++i] : source[i]; i++ } if (source[i++] !== quote) throw new Error('Unterminated string.'); out.push({type:'string',value}); continue }
    const number = source.slice(i).match(/^-?\d+(?:\.\d+)?/); if (number) { out.push({type:'number',value:Number(number[0])}); i += number[0].length; continue }
    const ident = source.slice(i).match(/^[A-Za-z_*][A-Za-z0-9_*-]*/); if (ident) { const word = ident[0]; const lower = word.toLowerCase(); out.push(lower === 'true' || lower === 'false' ? {type:'boolean',value:lower === 'true' ? 1 : 0} : lower === 'null' ? {type:'null'} : {type:'ident',value:word}); i += word.length; continue }
    throw new Error(`Unexpected character '${source[i]}'.`);
  }
  return [...out,{type:'end'}];
}

function callFunction(name: string, args: unknown[]) {
  switch (name.toLowerCase()) {
    case 'contains': return Array.isArray(args[0]) ? args[0].some((v) => eq(v,args[1])) : display(args[0]).toLowerCase().includes(display(args[1]).toLowerCase());
    case 'startswith': return display(args[0]).toLowerCase().startsWith(display(args[1]).toLowerCase());
    case 'endswith': return display(args[0]).toLowerCase().endsWith(display(args[1]).toLowerCase());
    case 'fromjson': return JSON.parse(display(args[0]));
    case 'tojson': return JSON.stringify(args[0]);
    case 'join': return Array.isArray(args[0]) ? args[0].map(display).join(display(args[1] ?? ',')) : '';
    case 'format': return args.slice(1).reduce((text,value,index) => String(text).replaceAll(`{${index}}`,display(value)), display(args[0]));
    case 'always': case 'success': return true;
    case 'failure': case 'cancelled': return false;
    case 'hashfiles': throw new Error('Unknown:hashFiles() requires repository file access.');
    default: throw new Error(`Unknown:Function ${name}() is not supported.`);
  }
}

function makeContext(workflow: Obj, event: SyntheticEvent, matrix: Obj, results: Record<string,string>): Obj {
  const needs = Object.fromEntries(Object.entries(results).map(([id,result]) => [id,{result,outputs:{}}]));
  return { github: { event_name:event.name, event:{action:event.action,inputs:event.inputs,pull_request:{base:{ref:event.base},head:{ref:event.head},labels:(event.labels ?? []).map(name => ({name}))}}, ref:`refs/heads/${event.head ?? ''}`, ref_name:event.head, base_ref:event.base, head_ref:event.head, repository:'local/repository', actor:'local' }, inputs:event.inputs, matrix, needs, env:workflow.env ?? {}, vars:{} };
}

function expandMatrix(matrix: unknown): Obj[] {
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) return [{}];
  const axes = Object.entries(matrix as Obj).filter(([key]) => !['include','exclude'].includes(key)); let cells: Obj[] = [{}];
  for (const [key,values] of axes) { const next: Obj[] = []; for (const cell of cells) for (const value of list(values)) next.push({...cell,[key]:value}); cells = next.slice(0,256) }
  for (const excluded of list<Obj>((matrix as Obj).exclude)) cells = cells.filter((cell) => !Object.entries(excluded).every(([key,value]) => eq(cell[key],value)));
  for (const included of list<Obj>((matrix as Obj).include)) { const match = cells.find((cell) => Object.entries(included).every(([key,value]) => !(key in cell) || eq(cell[key],value))); if (match) Object.assign(match,included); else cells.push({...included}) }
  return cells.length ? cells : [{}];
}

function topoSort(entries: [string, any][]): [string, any][] { const remaining = new Map(entries); const out: [string,any][] = []; while (remaining.size) { const ready = [...remaining].filter(([,job]) => list(job.needs).every((need) => out.some(([id]) => id === need) || !remaining.has(need))); if (!ready.length) return [...out,...remaining]; for (const item of ready) { out.push(item); remaining.delete(item[0]) } } return out }
function matchesPatterns(value: string, patterns: string[], initial: boolean) { let matched = initial; for (const raw of patterns) { const negative = raw.startsWith('!'); const pattern = negative ? raw.slice(1) : raw; const regex = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*\*/g,'§§').replace(/\*/g,'[^/]*').replace(/§§/g,'.*').replace(/\?/g,'.')}$`); if (regex.test(value)) matched = !negative } return matched }
function resolveTemplates(source: string, context: Obj) { return source.replace(/\$\{\{(.+?)\}\}/g,(_,expr) => { const result = evaluateExpression(expr,context); return result.unknown ? `<unknown: ${result.unknown}>` : result.error ? `<error: ${result.error}>` : display(result.value) }) }
function list<T = string>(value: unknown): T[] { if (value == null) return []; return (Array.isArray(value) ? value : [value]) as T[] }
function decision(outcome: Outcome, reason: string, value?: unknown): Decision { return {outcome,reason,...(value === undefined ? {} : {value})} }
function truthy(value: unknown) { return value !== null && value !== false && value !== 0 && value !== '' && value !== undefined }
function display(value: unknown) { return typeof value === 'string' ? value : value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value) }
function coerce(value: unknown): number | string { const number = Number(value); return Number.isNaN(number) ? display(value).toLowerCase() : number }
function eq(a: unknown,b: unknown) { const left = coerce(a), right = coerce(b); return typeof left === 'string' && typeof right === 'string' ? left.toLowerCase() === right.toLowerCase() : left === right }
