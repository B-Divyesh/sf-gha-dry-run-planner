import './style.css';
import { mountSiteChrome } from './chrome';

const SITE = 'https://gha-dry-run-planner.sociobot.in';

mountSiteChrome();
document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `${SITE}${location.pathname}`;
