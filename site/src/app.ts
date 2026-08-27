import './style.css';
import { planWorkflow, type BrowserPlan, type SyntheticEvent } from './engine';

const EXAMPLE = `name: Pull request checks
on:
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
      - '!src/docs/**'

permissions:
  contents: read

jobs:
  quality:
    name: Quality · \${{ matrix.node }}
    if: github.event_name == 'pull_request'
    strategy:
      matrix:
        node: [20, 22]
        os: [ubuntu, windows]
        exclude:
          - { node: 20, os: windows }
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        if: matrix.os != 'windows'
        run: npm test -- --node=\${{ matrix.node }}

  preview:
    needs: quality
    if: startsWith(github.head_ref, 'feature/')
    steps:
      - name: Prepare preview
        run: echo "planning for \${{ github.head_ref }}"
      - name: Note deployment token
        env:
          TOKEN: \${{ secrets.PREVIEW_TOKEN }}
        run: echo "Token stays unknown"
`;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const source = $('#workflow-source') as HTMLTextAreaElement;
const form = $('#event-form') as HTMLFormElement;
const result = $('#result');
const lineCount = $('#line-count');
const toast = $('#toast');
let latestPlan: BrowserPlan | null = null;

source.value = EXAMPLE;
updateLineCount();
renderEmpty();

form.addEventListener('submit', (event) => { event.preventDefault(); runPlanner(); });
source.addEventListener('input', updateLineCount);
source.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') { event.preventDefault(); const start = source.selectionStart; source.setRangeText('  ', start, source.selectionEnd, 'end'); }
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); runPlanner(); }
});
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && document.activeElement !== source) runPlanner(); });

$('#workflow-file').addEventListener('change', async (event) => {
  const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (!file) return;
  if (file.size > 1_000_000) { showToast('Choose a workflow smaller than 1 MB'); return }
  source.value = await file.text(); updateLineCount(); runPlanner();
});

$('#copy-json').addEventListener('click', async () => {
  if (!latestPlan) { showToast('Plan a workflow first'); return }
  await copyText(JSON.stringify(latestPlan,null,2)); showToast('Plan JSON copied');
});
$('#expand-all').addEventListener('click', (event) => {
  const details = result.querySelectorAll('details'); const shouldOpen = [...details].some((item) => !item.open); details.forEach((item) => item.open = shouldOpen); (event.currentTarget as HTMLButtonElement).textContent = shouldOpen ? 'Collapse all' : 'Expand all';
});
document.querySelectorAll<HTMLElement>('[data-copy]').forEach((button) => button.addEventListener('click', async () => { await copyText(button.dataset.copy!); showToast('Install command copied') }));

function runPlanner() {
  if (!source.value.trim()) { latestPlan = null; renderEmpty('Paste or open a workflow to begin.'); source.focus(); return }
  const event: SyntheticEvent = {
    name: ($('#event') as HTMLSelectElement).value,
    action: ($('#event') as HTMLSelectElement).value.startsWith('pull_request') ? 'synchronize' : undefined,
    base: ($('#base') as HTMLInputElement).value.trim() || undefined,
    head: ($('#head') as HTMLInputElement).value.trim() || undefined,
    paths: ($('#paths') as HTMLTextAreaElement).value.split(/\n|,/).map((value) => value.trim()).filter(Boolean),
    inputs: parseInputs(($('#inputs') as HTMLTextAreaElement).value),
  };
  result.setAttribute('aria-busy','true');
  window.requestAnimationFrame(() => { latestPlan = planWorkflow(source.value,event); renderPlan(latestPlan); result.setAttribute('aria-busy','false'); $('#result-heading').focus({preventScroll:true}); });
}

function renderPlan(plan: BrowserPlan) {
  if (plan.decision.outcome === 'error') { result.innerHTML = `<div class="error-state"><div class="empty-mark" aria-hidden="true">×</div><h4>That YAML needs attention</h4><p>${escape(plan.decision.reason)}</p></div>`; return }
  const jobs = plan.jobs.length; const cells = plan.jobs.reduce((sum,job) => sum + job.cells.length,0); const steps = plan.jobs.reduce((sum,job) => sum + job.cells.reduce((n,cell) => n + cell.steps.length,0),0);
  result.innerHTML = `<div class="summary"><span>Workflow <strong>${escape(plan.decision.outcome.toUpperCase())}</strong></span><span><strong>${jobs}</strong> ${jobs === 1 ? 'job' : 'jobs'}</span><span><strong>${cells}</strong> ${cells === 1 ? 'cell' : 'cells'}</span><span><strong>${steps}</strong> ${steps === 1 ? 'step' : 'steps'}</span></div>
    <ul class="plan-tree"><li class="plan-node"><div class="node-row"><span class="status-dot ${plan.decision.outcome}" aria-hidden="true"></span><span class="node-title">${escape(plan.name)} <small>workflow</small></span><span class="decision">${escape(plan.decision.reason)}</span></div>${renderJobs(plan)}</li></ul>
    ${renderMeta(plan)}`;
}

function renderJobs(plan: BrowserPlan) {
  if (!plan.jobs.length) return `<div class="plan-meta">No jobs are planned because the workflow trigger is <strong>${escape(plan.decision.outcome)}</strong>.</div>`;
  return `<ul class="children">${plan.jobs.map((job) => `<li class="plan-node"><details open><summary class="node-row"><span class="status-dot ${job.decision.outcome}" aria-hidden="true"></span><span class="node-title">${escape(job.name)} <small>${escape(job.id)}${job.needs.length ? ` · needs ${job.needs.map(escape).join(', ')}` : ''}</small></span><span class="decision">${escape(job.decision.reason)}</span></summary><ul class="children">${job.cells.map((cell,index) => `<li><div class="step-row"><span class="status-dot run" aria-hidden="true"></span><span><strong>${Object.keys(cell.values).length ? `Matrix ${index + 1}` : 'Steps'}</strong>${Object.keys(cell.values).length ? ` · <code>${Object.entries(cell.values).map(([k,v]) => `${escape(k)}=${escape(String(v))}`).join(' ')}</code>` : ''}</span></div><ul class="children">${cell.steps.map((step) => `<li class="step-row"><span class="status-dot ${step.decision.outcome}" aria-hidden="true"></span><span><strong>${escape(step.name)}</strong><br />${escape(step.decision.reason)}${step.run?.includes('<unknown:') ? ' · resolved command contains an unknown' : ''}</span></li>`).join('')}</ul></li>`).join('')}</ul></details></li>`).join('')}</ul>`;
}

function renderMeta(plan: BrowserPlan) {
  const items = [...(plan.secrets.length ? [`Secrets referenced: ${plan.secrets.join(', ')} (values unknown)`] : []), ...(plan.permissions.length ? [`Permissions: ${plan.permissions.join(', ')}`] : []), ...plan.warnings];
  return items.length ? `<div class="plan-meta"><strong>Static analysis notes</strong><ul>${items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul></div>` : '';
}

function renderEmpty(message = 'Your explained workflow plan will appear here.') { result.innerHTML = `<div class="empty-state"><div class="empty-mark" aria-hidden="true">⌁</div><h4>Ready when the workflow is</h4><p>${escape(message)} Press “Plan workflow” or <kbd>⌘ ↵</kbd>.</p></div>` }
function updateLineCount() { const lines = source.value ? source.value.split('\n').length : 0; lineCount.textContent = `${lines} ${lines === 1 ? 'line' : 'lines'}` }
function parseInputs(raw: string) { return Object.fromEntries(raw.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => { const [key,...rest] = line.split('='); const value = rest.join('='); try { return [key,JSON.parse(value)] } catch { return [key,value] } })) }
function escape(value: string) { return value.replace(/[&<>'"]/g,(character) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]!)) }
async function copyText(text: string) { try { await navigator.clipboard.writeText(text) } catch { const area = document.createElement('textarea'); area.value = text; document.body.append(area); area.select(); document.execCommand('copy'); area.remove() } }
let toastTimer = 0; function showToast(message: string) { toast.textContent = message; toast.classList.add('show'); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('show'),1800) }
function updateConnection() { const el = $('#connection-state'); el.classList.toggle('is-offline',!navigator.onLine); el.innerHTML = navigator.onLine ? '<span></span> Works offline after first load' : '<span></span> Offline — planner still works' }
window.addEventListener('online',updateConnection); window.addEventListener('offline',updateConnection); updateConnection();
if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',() => navigator.serviceWorker.register('/sw.js'));
