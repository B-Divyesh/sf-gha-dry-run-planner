const REPOSITORY = 'https://github.com/B-Divyesh/sf-gha-dry-run-planner';

const externalLabel = '<span class="external-mark" aria-hidden="true">↗</span><span class="sr-only"> (external link)</span>';

export function mountSiteChrome(): void {
  const header = document.querySelector<HTMLElement>('#site-header');
  const footer = document.querySelector<HTMLElement>('#site-footer');
  if (!header || !footer) throw new Error('Site chrome mount points are missing.');

  header.innerHTML = `
    <a class="wordmark" href="/" aria-label="ghaplan home">
      <svg aria-hidden="true" viewBox="0 0 36 36" width="36" height="36"><path d="M8 18c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10S8 23.5 8 18Z"/><path d="M12 18h5m0 0 4-5m-4 5 4 5m0-10h4m-4 10h4"/></svg>
      <span>gha<span>plan</span></span>
    </a>
    <nav aria-label="Primary navigation">
      <a href="/demo">Demo</a>
      <a href="/#planner">Planner</a>
      <a href="/privacy">Privacy</a>
      <a class="repo-link external-link" href="${REPOSITORY}">Source ${externalLabel}</a>
    </nav>`;

  footer.innerHTML = `
    <div class="wordmark"><span>gha<span>plan</span></span></div>
    <p>Plan a GitHub Actions workflow before you push.</p>
    <div class="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/#limits">Limits</a></div>
    <p class="fine">MIT licensed · Built by Param Factory · build polish-3 · © 2026</p>`;
}
