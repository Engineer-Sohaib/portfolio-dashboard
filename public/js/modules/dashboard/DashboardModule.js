import { Module } from '../../core/Module.js';
import { storage } from '../../core/StorageService.js';
import { $, $all, $id, escapeHtml } from '../../utils/dom.js';
import { timeAgo } from '../../utils/format.js';

import { SEED_PROJECTS, CATEGORY_META_PROJECTS } from '../projects/ProjectsModule.js';
import { SEED_TECHNOLOGIES, GROUP_META, LEVEL_META } from '../technologies/TechnologiesModule.js';
import { SEED_EXPERIENCE } from '../experience/ExperienceModule.js';
import { SEED_TESTIMONIALS } from '../testimonials/TestimonialsModule.js';
import { SEED_MEDIA } from '../media/MediaModule.js';
import { DEFAULT_CATEGORY_META } from '../categories/CategoriesModule.js';

const PALETTE = [
  'var(--pa-web)', 'var(--pa-green)', 'var(--pa-edu)', 'var(--pa-orange)',
  'var(--pa-pink)', 'var(--pa-yellow)', 'var(--pa-blue)', 'var(--pa-purple)',
];

const STATUS_COLORS = {
  Completed: 'var(--pa-green)',
  'In Progress': 'var(--pa-orange)',
  Draft: 'var(--pa-edu)',
  'On Hold': 'var(--pa-yellow)',
  Cancelled: 'var(--pa-red)',
};

const STATUS_BADGE_CLASS = {
  Completed: 'published',
  Draft: 'draft',
};

const THUMB_CLASSES = ['pa-dash-thumb-orange', 'pa-dash-thumb-purple', 'pa-dash-thumb-pink', 'pa-dash-thumb-blue'];

const CATEGORY_ICONS = {
  enterprise: 'ri-building-2-line', educational: 'ri-graduation-cap-line', desktop: 'ri-computer-line',
  medical: 'ri-heart-pulse-line', ecommerce: 'ri-shopping-bag-line', travel: 'ri-flight-takeoff-line',
  web: 'ri-globe-line', nonprofit: 'ri-hand-heart-line',
};
const DEFAULT_ICON = 'ri-apps-line';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseYearMonth(ym) {
  if (!ym) return null;
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1);
}

function mondayIndex(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return (d.getDay() + 6) % 7;
}

function niceCeiling(maxValue) {
  return Math.max(5, Math.ceil(maxValue / 5) * 5);
}

function resolveColor(value) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^var\((--[\w-]+)\)$/);
  if (!match) return value;
  const resolved = getComputedStyle(document.body).getPropertyValue(match[1]).trim();
  return resolved || value;
}

let chartIdSeq = 0;
function ensureId(el, prefix) {
  if (!el.id) el.id = `${prefix}${++chartIdSeq}`;
  return el.id;
}

export class DashboardModule extends Module {
  constructor() {
    super({ name: 'Dashboard' });
  }

  async load() {
    const [projects, technologies, experience, testimonials, media, categoryMeta] = await Promise.all([
      storage.get('pa_projects', null),
      storage.get('pa_technologies', null),
      storage.get('pa_experience', null),
      storage.get('pa_testimonials', null),
      storage.get('pa_media_library', null),
      storage.get('pa_category_meta', null),
    ]);

    this.projects = projects || SEED_PROJECTS.map((p) => ({ ...p }));
    this.technologies = technologies || SEED_TECHNOLOGIES.map((t) => ({ ...t }));
    this.experience = experience || SEED_EXPERIENCE.map((e) => ({ ...e }));
    this.testimonials = testimonials || SEED_TESTIMONIALS.map((t) => ({ ...t }));
    this.media = media || SEED_MEDIA.map((m) => ({ ...m }));
    this.categoryMeta = categoryMeta || DEFAULT_CATEGORY_META;
  }

  render() {
    this.renderStatCards();
    this.renderStatusDonut();
    this.renderCategoryDonut();
    this.renderTechGroupDonut();
    this.renderTechLevelDonut();
    this.renderCompletionGauge();
    this.renderExperienceBarChart();
    this.renderProjectsOverTimeLine();
    this.renderWeeklyActivityChart();
    this.renderRecentProjects();
    this.renderRecentActivity();
  }

  bindEvents() {
  }

  renderStatCards() {
    this.setText('#dashTotalProjects', this.projects.length);
    this.setText('#dashTotalTech', this.technologies.length);
    this.setText('#dashTotalMedia', this.media.length);
    this.setText('#dashTotalTesti', this.testimonials.length);
    this.setText('#dashTotalExp', this.experience.length);

    this.updateStatTrend('#dashTotalProjects', this.countRecent(this.projects, 'createdAt'), 'project');
    this.updateStatTrend('#dashTotalMedia', this.countRecent(this.media, 'uploadedAt'), 'file');
    this.updateStatTrend('#dashTotalTesti', this.countRecent(this.testimonials, 'createdAt'), 'testimonial');
  }

  countRecent(records, dateField, days = 30) {
    const cutoff = Date.now() - days * 24 * 3600 * 1000;
    return records.filter((r) => {
      const t = r[dateField] ? new Date(r[dateField]).getTime() : NaN;
      return !Number.isNaN(t) && t >= cutoff;
    }).length;
  }

  updateStatTrend(numberSelector, count, noun) {
    const numEl = $(numberSelector);
    const card = numEl ? numEl.closest('.pa-dash-stat-card') : null;
    const changeEl = card ? $('.pa-dash-stat-change', card) : null;
    if (!changeEl) return;
    if (count > 0) {
      changeEl.className = 'pa-dash-stat-change up';
      changeEl.innerHTML = `<i class="ri-arrow-up-line"></i> ${count} new ${noun}${count > 1 ? 's' : ''} this month`;
    } else {
      changeEl.className = 'pa-dash-stat-change neutral';
      changeEl.innerHTML = `<i class="ri-subtract-line"></i> No new ${noun}s this month`;
    }
  }

  setText(selector, value) {
    const el = $(selector);
    if (el) el.textContent = String(value);
  }

  buildDonut(cardEl, segments, centerLabel) {
    if (!cardEl) return;
    const container = $('.pa-donut-canvas', cardEl);
    const legend = $('.pa-donut-legend', cardEl);
    const centerValue = $('.pa-donut-center-value', cardEl);
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    const safeTotal = total || 1;

    if (container && typeof CanvasJS !== 'undefined') {
      const id = ensureId(container, 'paDonutCanvas');
      container.innerHTML = '';
      const dataPoints = segments.length
        ? segments.map((seg) => ({ label: seg.label, y: seg.value, color: resolveColor(seg.color) }))
        : [{ label: 'No data', y: 1, color: resolveColor('var(--pa-border-soft)') }];
      new CanvasJS.Chart(id, {
        backgroundColor: 'transparent',
        animationEnabled: true,
        toolTip: { enabled: segments.length > 0 },
        data: [{
          type: 'doughnut',
          innerRadius: '72%',
          radius: '96%',
          showInLegend: false,
          dataPoints,
        }],
      }).render();
    }
    if (centerValue) centerValue.textContent = centerLabel != null ? centerLabel : total;
    if (legend) {
      legend.innerHTML = segments.length ? segments.map((seg) => {
        const pct = Math.round((seg.value / safeTotal) * 100);
        return `<div class="pa-donut-legend-item">
          <span class="pa-donut-dot" style="background:${seg.color}"></span>
          <span class="pa-donut-legend-label">${escapeHtml(seg.label)}</span>
          <span class="pa-donut-legend-value">${seg.value}</span>
          <span class="pa-donut-legend-pct">(${pct}%)</span>
        </div>`;
      }).join('') : `<div class="pa-donut-legend-item"><span class="pa-donut-legend-label">No data yet</span></div>`;
    }
  }

  buildExplodedPie(cardEl, segments) {
    if (!cardEl) return;
    const container = $('.pa-explode-pie-canvas', cardEl);
    if (!container || typeof CanvasJS === 'undefined') return;

    const id = ensureId(container, 'paExplodePieCanvas');
    container.innerHTML = '';
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    const dataPoints = segments.length
      ? segments.map((seg) => ({
        label: seg.label,
        y: seg.value,
        color: resolveColor(seg.color),
        indexLabel: total ? `${Math.round((seg.value / total) * 100)}%` : '',
      }))
      : [{ label: 'No data yet', y: 1, color: resolveColor('var(--pa-border-soft)') }];

    new CanvasJS.Chart(id, {
      backgroundColor: 'transparent',
      animationEnabled: true,
      toolTip: { enabled: segments.length > 0 },
      legend: {
        verticalAlign: 'center',
        horizontalAlign: 'right',
        fontColor: resolveColor('var(--pa-text-dim)'),
        fontSize: 12,
      },
      data: [{
        type: 'pie',
        startAngle: -90,
        radius: '82%',
        showInLegend: segments.length > 0,
        indexLabelFontColor: resolveColor('var(--pa-text-dim)'),
        indexLabelLineColor: resolveColor('var(--pa-border-hover)'),
        indexLabelFontSize: 11,
        dataPoints,
      }],
    }).render();
  }

  renderStatusDonut() {
    const card = $all('.pa-dash-charts-row-3 .pa-donut-card')[0];
    if (!card) return;
    const counts = {};
    this.projects.forEach((p) => { const s = p.status || 'Unknown'; counts[s] = (counts[s] || 0) + 1; });
    let cycle = 0;
    const segments = Object.entries(counts).map(([label, value]) => ({
      label, value, color: STATUS_COLORS[label] || PALETTE[cycle++ % PALETTE.length],
    }));
    this.buildDonut(card, segments, this.projects.length);
  }

  renderCategoryDonut() {
    const card = $('.pa-explode-pie-card');
    if (!card) return;
    const counts = {};
    this.projects.forEach((p) => { const c = p.catKey || 'other'; counts[c] = (counts[c] || 0) + 1; });
    const segments = Object.entries(counts).map(([key, value], i) => ({
      label: this.categoryMeta[key]?.label || CATEGORY_META_PROJECTS[key]?.label || key,
      value,
      color: PALETTE[i % PALETTE.length],
    }));
    this.buildExplodedPie(card, segments, this.projects.length, 'Projects');
  }

  renderTechGroupDonut() {
    const card = $all('.pa-dash-charts-row-3 .pa-donut-card')[1];
    if (!card) return;
    const counts = {};
    this.technologies.forEach((t) => { const g = t.group || 'other'; counts[g] = (counts[g] || 0) + 1; });
    let cycle = 0;
    const segments = Object.entries(counts).map(([key, value]) => ({
      label: GROUP_META[key]?.label || key,
      value,
      color: GROUP_META[key]?.color || PALETTE[cycle++ % PALETTE.length],
    }));
    this.buildDonut(card, segments, this.technologies.length);
  }

  renderTechLevelDonut() {
    const card = $('.pa-dash-charts-3 .pa-donut-card');
    if (!card) return;
    const titleEl = $('.pa-dash-chart-title', card);
    if (titleEl) titleEl.textContent = 'Technologies by Skill Level';

    const order = ['expert', 'advanced', 'intermediate', 'beginner'];
    const counts = {};
    this.technologies.forEach((t) => { const l = t.level || 'unrated'; counts[l] = (counts[l] || 0) + 1; });
    const keys = Object.keys(counts).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const segments = keys.map((key) => ({
      label: LEVEL_META[key]?.label || key,
      value: counts[key],
      color: LEVEL_META[key]?.color || PALETTE[0],
    }));
    this.buildDonut(card, segments, this.technologies.length);

    const container = $('.pa-donut-canvas', card);
    if (container) container.setAttribute('aria-label', 'Technologies by skill level donut chart');
  }

  renderCompletionGauge() {
    const card = $('.pa-gauge-chart-card');
    if (!card) return;
    const total = this.projects.length;
    const completed = this.projects.filter((p) => p.status === 'Completed').length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    const container = $('.pa-gauge-canvas', card);
    if (container && typeof CanvasJS !== 'undefined') {
      const id = ensureId(container, 'paGaugeCanvas');
      container.innerHTML = '';
      const fillColor = pct >= 75 ? 'var(--pa-green)' : pct >= 50 ? 'var(--pa-yellow)' : pct >= 25 ? 'var(--pa-orange)' : 'var(--pa-red)';
      new CanvasJS.Chart(id, {
        backgroundColor: 'transparent',
        animationEnabled: true,
        toolTip: { enabled: false },
        data: [{
          type: 'doughnut',
          startAngle: -90,
          innerRadius: '78%',
          radius: '98%',
          showInLegend: false,
          dataPoints: [
            { y: pct, color: resolveColor(fillColor) },
            { y: 100 - pct, color: resolveColor('var(--pa-border-soft)') },
          ],
        }],
      }).render();
    }
    if (container) container.setAttribute('aria-label', `Projects completion rate gauge showing ${pct} percent`);

    const valueEl = $('.pa-gauge-value', card);
    if (valueEl) valueEl.textContent = `${pct}%`;

    const trendEl = $('.pa-gauge-trend', card);
    if (trendEl) trendEl.innerHTML = `<i class="ri-checkbox-circle-line"></i> ${completed} of ${total} projects completed`;
  }

  renderExperienceBarChart() {
    const card = $('.pa-bar-chart-card');
    const container = card ? $('.pa-canvasjs-mount-bar', card) : null;
    if (!container || typeof CanvasJS === 'undefined') return;

    const buckets = [
      { label: '<1Y', min: 0, max: 1, color: 'var(--pa-web)' },
      { label: '1-2 Y', min: 1, max: 2, color: 'var(--pa-green)' },
      { label: '2-3 Y', min: 2, max: 3, color: 'var(--pa-yellow)' },
      { label: '3-5 Y', min: 3, max: 5, color: 'var(--pa-orange)' },
      { label: '5+ Y', min: 5, max: Infinity, color: 'var(--pa-pink)' },
    ];
    const now = new Date();
    const msPerYear = 365.25 * 24 * 3600 * 1000;
    this.experience.forEach((e) => {
      const start = parseYearMonth(e.startDate);
      if (!start) return;
      const end = e.current || !e.endDate ? now : (parseYearMonth(e.endDate) || now);
      const years = Math.max(0, (end - start) / msPerYear);
      const bucket = buckets.find((b) => years >= b.min && years < b.max) || buckets[buckets.length - 1];
      bucket.count = (bucket.count || 0) + 1;
    });
    buckets.forEach((b) => { b.count = b.count || 0; });

    const id = ensureId(container, 'paExperienceBarChart');
    container.innerHTML = '';
    new CanvasJS.Chart(id, {
      backgroundColor: 'transparent',
      animationEnabled: true,
      axisX: {
        labelFontColor: resolveColor('var(--pa-text-faint)'),
        lineColor: resolveColor('var(--pa-border-soft)'),
        tickColor: resolveColor('var(--pa-border-soft)'),
      },
      axisY: {
        gridColor: resolveColor('var(--pa-border-soft)'),
        labelFontColor: resolveColor('var(--pa-text-faint)'),
        includeZero: true,
        gridThickness: 1,
        lineThickness: 0,
        interval: niceCeiling(Math.max(...buckets.map((b) => b.count))) / 5,
      },
      data: [{
        type: 'column',
        indexLabel: '{y}',
        indexLabelFontColor: resolveColor('var(--pa-text)'),
        indexLabelPlacement: 'outside',
        dataPoints: buckets.map((b) => ({ label: b.label, y: b.count, color: resolveColor(b.color) })),
      }],
    }).render();
  }

  renderProjectsOverTimeLine() {
    const card = $('.pa-line-chart-card');
    const container = card ? $('.pa-canvasjs-mount-line', card) : null;
    if (!container || typeof CanvasJS === 'undefined') return;

    const now = new Date();
    const year = now.getFullYear();
    const monthsCount = now.getMonth() + 1;

    const monthly = [];
    for (let m = 0; m < monthsCount; m++) {
      const cutoff = new Date(year, m + 1, 1);
      const count = this.projects.filter((p) => {
        const d = p.createdAt ? new Date(p.createdAt) : new Date(year, 0, 1);
        return d < cutoff;
      }).length;
      monthly.push({ label: MONTH_NAMES[m], value: count });
    }

    const id = ensureId(container, 'paProjectsOverTimeChart');
    container.innerHTML = '';
    new CanvasJS.Chart(id, {
      backgroundColor: 'transparent',
      animationEnabled: true,
      axisX: {
        labelFontColor: resolveColor('var(--pa-text-faint)'),
        lineColor: resolveColor('var(--pa-border-soft)'),
        tickColor: resolveColor('var(--pa-border-soft)'),
      },
      axisY: {
        gridColor: resolveColor('var(--pa-border-soft)'),
        labelFontColor: resolveColor('var(--pa-text-faint)'),
        includeZero: true,
        gridThickness: 1,
        lineThickness: 0,
        interval: niceCeiling(Math.max(...monthly.map((m) => m.value), 1)) / 3,
      },
      data: [{
        type: 'area',
        color: resolveColor('var(--pa-orange)'),
        fillOpacity: 0.28,
        lineThickness: 2.5,
        markerType: 'circle',
        markerSize: 7,
        markerColor: resolveColor('var(--pa-bg-card)'),
        markerBorderColor: resolveColor('var(--pa-orange)'),
        markerBorderThickness: 2,
        dataPoints: monthly.map((m) => ({ label: m.label, y: m.value })),
      }],
    }).render();
    container.setAttribute('aria-label', `Total projects over time from ${monthly[0].label} to ${monthly[monthly.length - 1].label}`);
  }

  renderWeeklyActivityChart() {
    const card = $('.pa-multiline-chart-card');
    const container = card ? $('.pa-canvasjs-mount-multiline', card) : null;
    if (!container || typeof CanvasJS === 'undefined') return;

    const projCounts = new Array(7).fill(0);
    const mediaCounts = new Array(7).fill(0);
    const testiCounts = new Array(7).fill(0);
    this.projects.forEach((p) => { const i = mondayIndex(p.createdAt); if (i != null) projCounts[i]++; });
    this.media.forEach((m) => { const i = mondayIndex(m.uploadedAt); if (i != null) mediaCounts[i]++; });
    this.testimonials.forEach((t) => { const i = mondayIndex(t.createdAt); if (i != null) testiCounts[i]++; });

    const axisTop = niceCeiling(Math.max(...projCounts, ...mediaCounts, ...testiCounts, 1));
    const toPoints = (counts) => counts.map((v, i) => ({ label: DAY_NAMES[i], y: v }));

    const id = ensureId(container, 'paWeeklyActivityChart');
    container.innerHTML = '';
    new CanvasJS.Chart(id, {
      backgroundColor: 'transparent',
      animationEnabled: true,
      toolTip: { shared: true },
      axisX: {
        labelFontColor: resolveColor('var(--pa-text-faint)'),
        lineColor: resolveColor('var(--pa-border-soft)'),
        tickColor: resolveColor('var(--pa-border-soft)'),
      },
      axisY: {
        gridColor: resolveColor('var(--pa-border-soft)'),
        labelFontColor: resolveColor('var(--pa-text-faint)'),
        includeZero: true,
        gridThickness: 1,
        lineThickness: 0,
        interval: axisTop / 5,
      },
      data: [
        { type: 'line', name: 'Projects', color: resolveColor('var(--pa-orange)'), lineThickness: 2.25, markerSize: 5, dataPoints: toPoints(projCounts) },
        { type: 'line', name: 'Media', color: resolveColor('var(--pa-web)'), lineThickness: 2.25, markerSize: 5, dataPoints: toPoints(mediaCounts) },
        { type: 'line', name: 'Testimonials', color: resolveColor('var(--pa-green)'), lineThickness: 2.25, markerSize: 5, dataPoints: toPoints(testiCounts) },
      ],
    }).render();
  }

  renderRecentProjects() {
    const container = $id('dashRecentProjects');
    if (!container) return;

    const sorted = this.projects.slice().sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (db !== da) return db - da;
      return (b.id || 0) - (a.id || 0);
    });
    const top = sorted.slice(0, 4);

    if (top.length === 0) {
      container.innerHTML = `<div class="pa-dash-recent-sub">No projects yet.</div>`;
      return;
    }

    container.innerHTML = top.map((p, i) => {
      const thumbClass = THUMB_CLASSES[i % THUMB_CLASSES.length];
      const icon = CATEGORY_ICONS[p.catKey] || DEFAULT_ICON;
      const catLabel = this.categoryMeta[p.catKey]?.label || CATEGORY_META_PROJECTS[p.catKey]?.label || p.catKey || '';
      const badgeClass = STATUS_BADGE_CLASS[p.status] || '';
      const meta = p.createdAt ? timeAgo(p.createdAt) : '—';
      return `<div class="pa-dash-recent-project">
        <div class="pa-dash-recent-thumb ${thumbClass}">
          <div class="pa-dash-thumb-icon"><i class="${icon}"></i></div>
        </div>
        <div class="pa-dash-recent-info">
          <div class="pa-dash-recent-title">${escapeHtml(p.title || 'Untitled')}</div>
          <div class="pa-dash-recent-sub">${escapeHtml(catLabel)}</div>
        </div>
        ${p.featured ? '<span class="pa-dash-recent-badge featured">Featured</span>' : ''}
        <span class="pa-dash-recent-badge ${badgeClass}">${escapeHtml(p.status || '—')}</span>
        <div class="pa-dash-recent-meta"><i class="ri-calendar-line"></i> ${escapeHtml(meta)}</div>
      </div>`;
    }).join('');
  }

  renderRecentActivity() {
    const container = $id('dashRecentActivity');
    if (!container) return;

    const items = [];
    this.projects.forEach((p) => {
      if (p.createdAt) items.push({ date: p.createdAt, icon: 'ri-apps-line', html: `Project <strong>"${escapeHtml(p.title || '')}"</strong> added by Admin User` });
    });
    this.media.forEach((m) => {
      if (m.uploadedAt) items.push({ date: m.uploadedAt, icon: 'ri-image-line', html: `New media file uploaded <strong>${escapeHtml(m.name || '')}</strong>` });
    });
    this.testimonials.forEach((t) => {
      if (t.createdAt) items.push({ date: t.createdAt, icon: 'ri-chat-quote-line', html: `New testimonial from <strong>${escapeHtml(t.name || '')}</strong>` });
    });
    this.experience.forEach((e) => {
      const d = parseYearMonth(e.startDate);
      if (d) items.push({ date: d.toISOString(), icon: 'ri-briefcase-line', html: `Experience <strong>"${escapeHtml(e.title || '')}"</strong> ${e.current ? 'is ongoing' : 'recorded'}` });
    });

    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    const top = items.slice(0, 5);

    if (top.length === 0) {
      container.innerHTML = `<div class="pa-dash-recent-sub">No recent activity yet.</div>`;
      return;
    }

    container.innerHTML = top.map((it) => `<div class="pa-dash-activity-item">
      <div class="pa-dash-activity-icon-wrap"><i class="${it.icon}"></i></div>
      <div class="pa-dash-activity-text">${it.html}</div>
      <div class="pa-dash-activity-time">${escapeHtml(timeAgo(it.date))}</div>
    </div>`).join('');
  }
}
