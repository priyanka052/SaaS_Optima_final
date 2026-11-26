import './styles.css';
import { api, formatMoney } from './api.js';

const app = document.querySelector('#app');

const state = {
  page: 'overview',
  tools: [],
  pricing: [],
  compare: null,
  negotiation: null,
  user: JSON.parse(localStorage.getItem('saasoptima_user') || 'null'),
};

const esc = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

function renderLogin() {
  app.innerHTML = `
    <div class="login-screen">
      <div class="login-card">

        <div class="login-brand">
          <span class="brand-mark">S</span>
          <span>SaaS<span class="brand-light">Optima</span></span>
        </div>

        <div class="login-visual">
          <div class="login-orbit orbit-one"></div>
          <div class="login-orbit orbit-two"></div>
          <div class="login-center">✳</div>
        </div>

        <div class="login-heading">
          <span class="eyebrow">SMARTER SAAS MANAGEMENT</span>
          <h1>Your workspace.<br/>Your clarity.</h1>
          <p>Take control of your software stack, spending and decisions.</p>
        </div>

        <form id="login-form">
          <label>
            Your name
            <input
              type="text"
              name="user_name"
              placeholder="Enter your name"
              required
            />
          </label>

          <label>
            Company name
            <input
              type="text"
              name="company_name"
              placeholder="Enter your company"
              required
            />
          </label>

          <button class="button primary login-submit" type="submit">
            Enter workspace <span>→</span>
          </button>
        </form>

        <div class="login-footer">
          <span>✦</span> Smarter software decisions start here.
        </div>

      </div>
    </div>
  `;

  document.querySelector('#login-form')
    .addEventListener('submit', (event) => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);

      const user = {
        name: String(form.get('user_name')).trim(),
        company: String(form.get('company_name')).trim(),
      };

      if (!user.name || !user.company) return;

      state.user = user;

      localStorage.setItem(
        'saasoptima_user',
        JSON.stringify(user)
      );

      renderPage('overview');
    });
}


function shell(content) {
  app.innerHTML = `
    <aside class="sidebar">
      <a class="brand" href="#overview">
        <span class="brand-mark">S</span>
        <span>SaaS<span class="brand-light">Optima</span></span>
      </a>

      <div class="nav-label">WORKSPACE</div>

      <nav>
        ${
          [
            ['overview', 'Overview'],
            ['stack', 'My Stack'],
            ['tools', 'SaaS tools'],
            ['pricing', 'Pricing'],
            ['compare', 'Compare'],
            ['overlap', 'Overlap'],
            ['negotiation', 'Negotiation'],
            ['history', 'History'],
            ['chat', 'Chatbot'],
          ]
            .map(
              ([key, label]) =>
                `<a class="nav-item ${
                  state.page === key ? 'active' : ''
                }" href="#${key}">
                  <span class="nav-dot"></span>${label}
                </a>`
            )
            .join('')
        }
      </nav>

      <div class="side-bottom">
        <span class="status-dot"></span>
        <span id="backend-status">Checking backend…</span>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="topbar-heading">
          <div class="eyebrow">SAAS SPEND MANAGEMENT</div>
          <h1>${pageTitle(state.page)}</h1>
          <p class="topbar-greeting">
            Hello, ${esc(state.user.name)} 👋
          </p>
        </div>

        <div class="topbar-actions">
          <div class="workspace-identity">
            <span class="workspace-avatar">
              ${esc(state.user.company.charAt(0).toUpperCase())}
            </span>
            <div class="workspace-details">
              <small>WORKSPACE</small>
              <strong>${esc(state.user.company)}</strong>
            </div>
          </div>

          <button class="icon-button" id="refresh" title="Refresh data" aria-label="Refresh data">
            ↻
          </button>

          <button class="button secondary logout-btn" id="logout" type="button">
            Logout
          </button>
        </div>
      </header>

      <section class="content">
        ${content}
      </section>
    </main>
  `;

  app
    .querySelector('#refresh')
    ?.addEventListener('click', () => renderPage(state.page));

  app
    .querySelector('#logout')
    ?.addEventListener('click', () => {
      localStorage.removeItem('saasoptima_user');
      state.user = null;
      renderLogin();
    });

  api
    .health()
    .then(() => setBackendStatus(true))
    .catch(() => setBackendStatus(false));
}

function setBackendStatus(ok) {
  const el = document.querySelector('#backend-status');

  if (el) {
    el.textContent = ok ? 'Backend connected' : 'Backend offline';
  }

  const dot = document.querySelector('.status-dot');

  if (dot) {
    dot.classList.toggle('offline', !ok);
  }
}

function pageTitle(page) {
  return (
    {
      overview: 'Overview',
      stack: 'My Stack',
      tools: 'SaaS tools',
      pricing: 'Pricing',
      compare: 'Compare tools',
      overlap: 'Feature overlap',
      negotiation: 'Negotiation',
      history: 'History',
      chat: 'Chatbot',
    }[page] || 'Overview'
  );
}

function loading(label = 'Loading data…') {
  return `
    <div class="state-card">
      <span class="spinner"></span>
      <span>${esc(label)}</span>
    </div>
  `;
}

function empty(message) {
  return `
    <div class="state-card empty">
      <span class="empty-icon">○</span>
      <strong>No results yet</strong>
      <span>${esc(message)}</span>
    </div>
  `;
}

function errorBox(error, retry) {
  return `
    <div class="error-box">
      <div>
        <strong>Couldn’t load this data</strong>
        <p>${esc(error.message || error)}</p>
      </div>

      <button class="button secondary" id="retry">
        Try again
      </button>
    </div>
  `;
}

function bindRetry(render) {
  document.querySelector('#retry')?.addEventListener('click', render);
}

function stat(label, value, note) {
  return `
    <article class="stat-card">
      <span class="stat-label">${esc(label)}</span>
      <strong class="stat-value">${esc(value)}</strong>
      <span class="stat-note">${esc(note)}</span>
    </article>
  `;
}


async function renderPage(page = 'overview') {
  if (!state.user) {
    renderLogin();
    return;
  }

  state.page = page;

  if (page === 'overview') return renderOverview();
  if (page === 'stack') return renderMyStack();
  if (page === 'tools') return renderTools();
  if (page === 'pricing') return renderPricing();
  if (page === 'compare') return renderCompare();
  if (page === 'overlap') return renderOverlap();
  if (page === 'negotiation') return renderNegotiation();
  if (page === 'history') return renderHistory();
  if (page === 'chat') return renderChat();

  return renderOverview();
}

async function renderOverview() {
  shell(loading('Loading your workspace…'));

  try {
    const [tools, pricing] = await Promise.all([
      api.tools(),
      api.pricing(),
    ]);

    state.tools = tools;
    state.pricing = pricing;

    const monthly = pricing.filter(
      (item) =>
        item.billing_period?.toLowerCase() === 'monthly'
    );

    const total = monthly.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );

    shell(`
      <div class="welcome">
        <div>
          <div class="eyebrow light">
            YOUR SOFTWARE, UNDER CONTROL
          </div>

          <h2>Make every SaaS dollar count.</h2>

          <p>
            Review your tools, compare plans, and find opportunities to save.
          </p>

          <a class="button white" href="#tools">
            Explore your tools <span>→</span>
          </a>
        </div>

        <div class="welcome-art">
          <span>✳</span>
          <i></i>
          <b></b>
        </div>
      </div>

      <div class="stat-grid">
        ${stat(
          'Tracked tools',
          tools.length,
          'Connected to your catalog'
        )}

        ${stat(
          'Pricing records',
          pricing.length,
          'Across all available plans'
        )}

        ${stat(
          'Listed monthly prices',
          formatMoney(total),
          `${monthly.length} monthly plans in the catalog`
        )}
      </div>

      <div class="section-heading">
        <div>
          <h2>Get started</h2>
          <p>Explore the data available from your backend.</p>
        </div>
      </div>

      <div class="shortcut-grid">

        <a class="shortcut" href="#tools">
          <span class="shortcut-icon purple">▦</span>
          <strong>Browse tools</strong>
          <span>See categories, features, and listed prices</span>
          <b>Open tools →</b>
        </a>

        <a class="shortcut" href="#pricing">
          <span class="shortcut-icon orange">＄</span>
          <strong>Review pricing</strong>
          <span>Compare plans and billing periods</span>
          <b>View pricing →</b>
        </a>

        <a class="shortcut" href="#compare">
          <span class="shortcut-icon green">⇄</span>
          <strong>Compare two tools</strong>
          <span>See feature overlap and price differences</span>
          <b>Start comparing →</b>
        </a>

        <a class="shortcut" href="#overlap">
          <span class="shortcut-icon green">⇄</span>
          <strong>Find savings opportunities</strong>
          <span>Review similar tools and lower-priced options</span>
          <b>Explore overlap →</b>
        </a>

      </div>

      <p class="note">
        Savings and recommendations appear when the backend has enough pricing data to calculate them.
      </p>
    `);
  } catch (error) {
    shell(errorBox(error, renderOverview));
    bindRetry(renderOverview);
  }
}


/* =========================================================
   TOOLS
   ========================================================= */

async function renderTools() {
  shell(loading('Loading tools…'));

  try {
    const [tools, pricing] = await Promise.all([
      api.tools(),
      api.pricing(),
    ]);

    state.tools = tools;
    state.pricing = pricing;

    if (!tools.length) {
      return shell(
        empty(
          'Add tools to the backend catalog to see them here.'
        )
      );
    }

    /*
      Match pricing records to tools using tool_id.

      If a tool has multiple pricing records,
      prefer the monthly pricing record.
    */
    const pricesByTool = new Map();

    pricing.forEach((item) => {
      const existing = pricesByTool.get(item.tool_id);

      if (
        !existing ||
        item.billing_period?.toLowerCase() === 'monthly'
      ) {
        pricesByTool.set(item.tool_id, item);
      }
    });

    shell(`
      <div class="toolbar">
        <div>
          <p class="muted">
            ${tools.length}
            ${tools.length === 1 ? 'tool' : 'tools'}
            in your catalog
          </p>
        </div>

        <input
          class="search"
          id="tool-search"
          placeholder="Search tools or categories…"
          aria-label="Search tools"
        />
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>TOOL</th>
              <th>CATEGORY</th>
              <th>FEATURES</th>
              <th>LISTED PRICE</th>
              <th>WEBSITE</th>
            </tr>
          </thead>

          <tbody id="tools-rows">
            ${tools
              .map((tool) =>
                toolRow(tool, pricesByTool)
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `);

    const search = document.querySelector('#tool-search');

    search.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();

      const filteredTools = tools.filter((tool) =>
        `${tool.name} ${tool.category}`
          .toLowerCase()
          .includes(term)
      );

      document.querySelector('#tools-rows').innerHTML =
        filteredTools
          .map((tool) =>
            toolRow(tool, pricesByTool)
          )
          .join('') ||
        `
          <tr>
            <td colspan="5" class="table-empty">
              No tools match “${esc(search.value)}”.
            </td>
          </tr>
        `;
    });
  } catch (error) {
    shell(errorBox(error, renderTools));
    bindRetry(renderTools);
  }
}

function toolRow(tool, pricesByTool) {
  const pricing = pricesByTool.get(tool.id);

  return `
    <tr>

      <td>
        <strong>${esc(tool.name)}</strong>
      </td>

      <td>
        <span class="pill">
          ${esc(tool.category)}
        </span>
      </td>

      <td>
        ${
          (tool.features || [])
            .slice(0, 4)
            .map(
              (feature) =>
                `<span class="feature-tag">${esc(feature)}</span>`
            )
            .join(' ') || '—'
        }
      </td>

      <td>
        ${
          pricing
            ? formatMoney(
                pricing.price,
                pricing.currency || 'INR'
              )
            : '—'
        }
      </td>

      <td>
        ${
          tool.url
            ? `
              <a
                class="text-link"
                href="${esc(tool.url)}"
                target="_blank"
                rel="noreferrer"
              >
                Visit ↗
              </a>
            `
            : '—'
        }
      </td>

    </tr>
  `;
}


/* =========================================================
   PRICING
   ========================================================= */

async function renderPricing() {
  shell(loading('Loading pricing…'));

  try {
    const [pricing, tools] = await Promise.all([
      api.pricing(),
      api.tools(),
    ]);

    state.pricing = pricing;
    state.tools = tools;

    if (!pricing.length) {
      return shell(
        empty(
          'No pricing records are available. Check that pricing data is seeded in the backend.'
        )
      );
    }

    const names = new Map(
      tools.map((tool) => [tool.id, tool.name])
    );

    shell(`
      <div class="toolbar">
        <p class="muted">
          Pricing data returned by the backend
        </p>

        <input
          class="search"
          id="pricing-search"
          placeholder="Search tool or plan…"
          aria-label="Search pricing"
        />
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>TOOL</th>
              <th>PLAN</th>
              <th>PRICE</th>
              <th>BILLING</th>
              <th>SOURCE</th>
              <th>UPDATED</th>
            </tr>
          </thead>

          <tbody id="pricing-rows">
            ${pricing
              .map((item) =>
                pricingRow(item, names)
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <p class="note">
        Prices are shown in the currency returned by the backend;
        different currencies are not added together.
      </p>
    `);

    document
      .querySelector('#pricing-search')
      .addEventListener('input', (event) => {
        const term = event.target.value.toLowerCase();

        document.querySelector('#pricing-rows').innerHTML =
          pricing
            .filter((item) =>
              `${names.get(item.tool_id) || ''} ${item.plan}`
                .toLowerCase()
                .includes(term)
            )
            .map((item) =>
              pricingRow(item, names)
            )
            .join('') ||
          `
            <tr>
              <td colspan="6" class="table-empty">
                No plans match “${esc(event.target.value)}”.
              </td>
            </tr>
          `;
      });
  } catch (error) {
    shell(errorBox(error, renderPricing));
    bindRetry(renderPricing);
  }
}

function pricingRow(item, names) {
  return `
    <tr>

      <td>
        <strong>
          ${esc(
            names.get(item.tool_id) ||
              `Tool #${item.tool_id}`
          )}
        </strong>
      </td>

      <td>
        ${esc(item.plan)}
      </td>

      <td class="price">
        ${formatMoney(item.price, item.currency)}
      </td>

      <td>
        <span class="pill">
          ${esc(item.billing_period)}
        </span>
      </td>

      <td>
        ${
          item.source_url
            ? `
              <a
                class="text-link"
                href="${esc(item.source_url)}"
                target="_blank"
                rel="noreferrer"
              >
                Source ↗
              </a>
            `
            : esc(item.source || '—')
        }
      </td>

      <td>
        ${
          item.last_updated
            ? esc(
                new Date(
                  item.last_updated
                ).toLocaleDateString()
              )
            : '—'
        }
      </td>

    </tr>
  `;
}


/* =========================================================
   COMPARE
   ========================================================= */

async function renderCompare() {
  shell(loading('Loading tools for comparison…'));

  try {
    const tools = await api.tools();

    state.tools = tools;

    if (tools.length < 2) {
      return shell(
        empty(
          'At least two tools are needed to compare.'
        )
      );
    }

    const options = tools
      .map(
        (tool) =>
          `<option value="${esc(tool.name)}">${esc(
            tool.name
          )}</option>`
      )
      .join('');

    shell(`
      <div class="panel">

        <div class="section-heading">
          <div>
            <h2>Compare two tools</h2>
            <p>
              Compare feature overlap, monthly price,
              and the backend’s cheaper option.
            </p>
          </div>
        </div>

        <form id="compare-form" class="form-grid">

          <label>
            First tool
            <select name="tool_a">
              ${options}
            </select>
          </label>

          <label>
            Second tool
            <select name="tool_b">
              ${
                tools.length > 1
                  ? tools
                      .slice(1)
                      .map(
                        (tool) =>
                          `<option value="${esc(
                            tool.name
                          )}">${esc(tool.name)}</option>`
                      )
                      .join('')
                  : options
              }
            </select>
          </label>

          <div class="form-action">
            <button
              class="button primary"
              type="submit"
            >
              Compare tools <span>→</span>
            </button>
          </div>

        </form>

        <div id="compare-result"></div>

      </div>
    `);

    document
      .querySelector('#compare-form')
      .addEventListener('submit', async (event) => {
        event.preventDefault();

        const data = new FormData(
          event.currentTarget
        );

        const a = data.get('tool_a');
        const b = data.get('tool_b');

        const result =
          document.querySelector('#compare-result');

        if (a === b) {
          result.innerHTML = `
            <div class="error-box">
              <p>
                Please select two different tools.
              </p>
            </div>
          `;

          return;
        }

        result.innerHTML =
          loading('Comparing tools…');

        try {
          state.compare = await api.compare(a, b);

          result.innerHTML =
            renderCompareResult(state.compare);
        } catch (error) {
          result.innerHTML = errorBox(
            error,
            () =>
              event.currentTarget.requestSubmit()
          );

          bindRetry(() =>
            document
              .querySelector('#compare-form')
              .requestSubmit()
          );
        }
      });
  } catch (error) {
    shell(errorBox(error, renderCompare));
    bindRetry(renderCompare);
  }
}

function renderCompareResult(data) {
  const a = data.tool_a;
  const b = data.tool_b;
  const overlap = data.overlap || {};
  const rec = data.recommendation || {};

  return `
    <div class="result-block">

      <div class="compare-cards">

        <article class="compare-card">
          <span class="eyebrow">TOOL A</span>

          <h3>${esc(a.name)}</h3>

          <p>${esc(a.category)}</p>

          <strong>
            ${formatMoney(a.price, a.currency)}
          </strong>

          <small>
            ${esc(a.plan || 'Monthly price')}
          </small>
        </article>

        <div class="versus">VS</div>

        <article class="compare-card">
          <span class="eyebrow">TOOL B</span>

          <h3>${esc(b.name)}</h3>

          <p>${esc(b.category)}</p>

          <strong>
            ${formatMoney(b.price, b.currency)}
          </strong>

          <small>
            ${esc(b.plan || 'Monthly price')}
          </small>
        </article>

      </div>

      <div class="result-summary">

        <div>
          <span>Feature similarity</span>
          <strong>
            ${esc(overlap.similarity ?? 0)}%
          </strong>
        </div>

        <div>
          <span>Potential monthly difference</span>

          <strong>
            ${
              rec.potential_monthly_savings == null
                ? '—'
                : formatMoney(
                    rec.potential_monthly_savings,
                    a.currency || b.currency
                  )
            }
          </strong>
        </div>

        <div>
          <span>Lower-priced tool</span>

          <strong>
            ${esc(
              rec.cheaper_tool ||
                'Not available'
            )}
          </strong>
        </div>

      </div>

      <div class="feature-columns">

        <div>
          <h4>Shared features</h4>
          ${featureList(
            overlap.common_features
          )}
        </div>

        <div>
          <h4>
            Only in ${esc(a.name)}
          </h4>
          ${featureList(
            overlap.unique_features_a
          )}
        </div>

        <div>
          <h4>
            Only in ${esc(b.name)}
          </h4>
          ${featureList(
            overlap.unique_features_b
          )}
        </div>

      </div>

    </div>
  `;
}

function featureList(items = []) {
  return items.length
    ? `
      <ul class="feature-list">
        ${items
          .map(
            (item) =>
              `<li>${esc(item)}</li>`
          )
          .join('')}
      </ul>
    `
    : `
      <p class="muted">
        No features listed.
      </p>
    `;
}


/* =========================================================
   OVERLAP
   ========================================================= */

async function renderOverlap() {
  const companyName = state.user.company;

  shell(loading('Analysing your company stack…'));

  try {
    const overlaps = await api.companyOverlap(companyName, 0);

    if (!overlaps.length) {
      return shell(
        empty(
          'Add at least two subscriptions to My Stack to analyse feature overlap.'
        )
      );
    }

    // Adapt company overlap data to the existing overlap card format
    const formatOverlaps = (rows) =>
      rows.map((row) => ({
        ...row,
        price_a: row.monthly_cost_a,
        price_b: row.monthly_cost_b,
        recommended_tool: row.cheaper_tool,
        potential_monthly_savings:
          row.monthly_cost_a != null &&
          row.monthly_cost_b != null &&
          row.currency_a === row.currency_b
            ? Math.abs(row.monthly_cost_a - row.monthly_cost_b)
            : null,
      }));

    const formattedOverlaps = formatOverlaps(overlaps);

    shell(`
      <div class="toolbar">

        <p class="muted">
          ${formattedOverlaps.length} company tool pairs found
        </p>

        <label class="threshold">
          Minimum similarity

          <input
            id="threshold"
            type="number"
            min="0"
            max="100"
            value="0"
          />

          %
        </label>

      </div>

      <div
        class="overlap-grid"
        id="overlap-rows"
      >
        ${formattedOverlaps
          .map(overlapCard)
          .join('')}
      </div>
    `);

    document
      .querySelector('#threshold')
      .addEventListener('change', async (event) => {

        const wrap = document.querySelector('#overlap-rows');

        wrap.innerHTML = loading('Updating results…');

        try {
          const threshold = Math.max(
            0,
            Math.min(
              100,
              Number(event.target.value) || 0
            )
          );

          const rows = await api.companyOverlap(
            companyName,
            threshold
          );

          const formattedRows = formatOverlaps(rows);

          wrap.innerHTML = formattedRows.length
            ? formattedRows
                .map(overlapCard)
                .join('')
            : `
              <div class="state-card empty">
                No company tool pairs meet this threshold.
              </div>
            `;

          document.querySelector('.toolbar p.muted')
            .textContent = `${formattedRows.length} company tool pairs found`;

        } catch (error) {
          wrap.innerHTML = `
            <div class="error-box">
              ${esc(error.message)}
            </div>
          `;
        }
      });

  } catch (error) {
    shell(errorBox(error, renderOverlap));
    bindRetry(renderOverlap);
  }
}

function overlapCard(item) {
  const similarity = Number(item.similarity) || 0;

  let overlapLevel;
  let recommendationHTML;

  if (similarity < 30) {
    overlapLevel = 'Low overlap';

    recommendationHTML = `
      <div class="recommendation">
        <span>Insight</span>
        <strong>Low feature overlap</strong>
        <small>
          These tools serve largely different purposes.
          No replacement recommendation.
        </small>
      </div>
    `;
  } else if (similarity < 60) {
    overlapLevel = 'Moderate overlap';

    recommendationHTML = `
      <div class="recommendation">
        <span>Insight</span>
        <strong>Partial feature overlap</strong>
        <small>
          Some features overlap, but replacing either tool
          may result in losing functionality.
        </small>
      </div>
    `;
  } else {
    overlapLevel = 'High overlap';

    recommendationHTML = `
      <div class="recommendation">
        <span>Potential consolidation</span>

        <strong>
          ${esc(item.recommended_tool || 'Compare plans')}
        </strong>

        <small>
          High feature similarity. Review whether one tool
          can meet your requirements before consolidating.
        </small>

        ${
          item.potential_monthly_savings == null
            ? ''
            : `
              <small>
                Estimated monthly cost difference:
                ${formatMoney(item.potential_monthly_savings)}
              </small>
            `
        }
      </div>
    `;
  }

  return `
    <article class="overlap-card">

      <div class="overlap-top">

        <span class="pill purple-pill">
          ${esc(similarity)}% similar
        </span>

        <span class="muted">
          ${esc(overlapLevel.toUpperCase())}
        </span>

      </div>

      <h3>
        ${esc(item.tool_a)}
        <span>↔</span>
        ${esc(item.tool_b)}
      </h3>

      <div class="price-pair">

        <div>
          <small>${esc(item.tool_a)}</small>

          <strong>
            ${formatMoney(item.price_a)}
          </strong>
        </div>

        <div>
          <small>${esc(item.tool_b)}</small>

          <strong>
            ${formatMoney(item.price_b)}
          </strong>
        </div>

      </div>

      ${recommendationHTML}

    </article>
  `;
}


/* =========================================================
   NEGOTIATION
   ========================================================= */

async function renderNegotiation() {
  shell(loading('Loading tools…'));

  try {
    const tools = await api.tools();

    state.tools = tools;

    if (!tools.length) {
      return shell(
        empty(
          'Add tools and pricing to the backend before starting a negotiation.'
        )
      );
    }

    shell(`
      <div class="panel">

        <div class="section-heading">
          <div>
            <h2>Start a negotiation</h2>

            <p>
              Choose a tool and set your budget.
              The backend will run and save the negotiation.
            </p>
          </div>
        </div>

        <form
          id="negotiation-form"
          class="form-grid"
        >

          <label>
            Tool

            <select
              name="tool_name"
              required
            >
              ${tools
                .map(
                  (tool) =>
                    `<option value="${esc(
                      tool.name
                    )}">
                      ${esc(tool.name)}
                    </option>`
                )
                .join('')}
            </select>
          </label>

          <label>
            Your monthly budget

            <input
              name="buyer_budget"
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 2500"
              required
            />
          </label>

          <label>
            Maximum discount

            <input
              name="max_discount_percent"
              type="number"
              min="0"
              max="50"
              value="20"
            />
          </label>

          <label>
            Maximum rounds

            <input
              name="max_rounds"
              type="number"
              min="1"
              max="20"
              value="6"
            />
          </label>

          <label class="wide">
            Required features

            <span class="label-hint">
              Optional, separate items with commas
            </span>

            <input
              name="required_features"
              placeholder="e.g. SSO, audit logs, analytics"
            />
          </label>

          <div class="form-action">

            <button
              class="button primary"
              type="submit"
            >
              Start negotiation <span>→</span>
            </button>

          </div>

        </form>

        <div id="negotiation-result">
          ${
            state.negotiation
              ? renderNegotiationResult(
                  state.negotiation
                )
              : ''
          }
        </div>

      </div>
    `);

    document
      .querySelector('#negotiation-form')
      .addEventListener(
        'submit',
        async (event) => {
          event.preventDefault();

          const form =
            new FormData(
              event.currentTarget
            );

          const result =
            document.querySelector(
              '#negotiation-result'
            );

          const body = {
            tool_name: form.get('tool_name'),

            buyer_budget: Number(
              form.get('buyer_budget')
            ),

            max_discount_percent: Number(
              form.get(
                'max_discount_percent'
              ) || 20
            ),

            max_rounds: Number(
              form.get('max_rounds') || 6
            ),

            required_features: String(
              form.get(
                'required_features'
              ) || ''
            )
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
          };

          result.innerHTML =
            loading(
              'Negotiation agents are working…'
            );

          try {
            state.negotiation =
              await api.negotiate(body);

            result.innerHTML =
              renderNegotiationResult(
                state.negotiation
              );
            bindEmailButton();
          } catch (error) {
            result.innerHTML = errorBox(
              error,
              () =>
                document
                  .querySelector(
                    '#negotiation-form'
                  )
                  .requestSubmit()
            );

            bindRetry(() =>
              document
                .querySelector(
                  '#negotiation-form'
                )
                .requestSubmit()
            );
          }
        }
      );
  } catch (error) {
    shell(errorBox(error, renderNegotiation));
    bindRetry(renderNegotiation);
  }
}

async function renderHistory() {
  shell(`
    <div class="panel">
      <div class="section-heading">
        <div>
          <h2>Negotiation History</h2>
          <p>View your previous negotiations and audit trails.</p>
        </div>
      </div>

      <div id="history-content">
        ${loading('Loading negotiation history…')}
      </div>
    </div>
  `);

  const content = document.querySelector('#history-content');

  try {
    const data = await api.history();

    if (!data.negotiations?.length) {
      content.innerHTML = `
        <div class="state-card">
          <strong>No negotiation history</strong>
          <span>No negotiations have been saved yet.</span>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tool</th>
              <th>Base Price</th>
              <th>Final Price</th>
              <th>Status</th>
              <th>Savings</th>
              <th>Deal Score</th>
            </tr>
          </thead>

          <tbody>
            ${data.negotiations.map((item) => `
              <tr>
                <td>#${esc(item.negotiation_id)}</td>
                <td>${esc(item.tool_name)}</td>
                <td>${formatMoney(item.base_price, 'INR')}</td>
                <td>
                  ${
                    item.final_price == null
                      ? '—'
                      : formatMoney(item.final_price, 'INR')
                  }
                </td>
                <td>
                  <span class="pill">${esc(item.status)}</span>
                </td>
                <td>${esc(item.savings_percent)}%</td>
                <td>${esc(item.deal_score)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    content.innerHTML = errorBox(error);
  }
}


async function renderChat() {
  state.chatSessionId = state.chatSessionId || null;

  shell(`
    <div class="panel">
      <div class="section-heading">
        <div>
          <h2>SaaSOptima Assistant</h2>
          <p>
            Ask about pricing, comparisons, alternatives, negotiations,
            history, or evaluation metrics.
          </p>
        </div>
      </div>

      <div
        id="chat-messages"
        style="
          min-height: 300px;
          max-height: 450px;
          overflow-y: auto;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        "
      >
        <div class="state-card">
          <strong>SaaSOptima Assistant</strong>
          <span>
            Hi! Ask me something like
            "price of Slack" or
            "compare Slack and Microsoft Teams".
          </span>
        </div>
      </div>

      <form id="chat-form" class="form-grid">
        <label class="wide">
          Message

          <input
            id="chat-input"
            name="message"
            placeholder="Ask SaaSOptima anything..."
            autocomplete="off"
            required
          />
        </label>

        <div class="form-action">
          <button class="button primary" type="submit">
            Send <span>→</span>
          </button>
        </div>
      </form>
    </div>
  `);

  document
    .querySelector('#chat-form')
    .addEventListener('submit', async (event) => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);
      const input = document.querySelector('#chat-input');
      const messages = document.querySelector('#chat-messages');
      const message = String(form.get('message') || '').trim();

      if (!message) return;

      messages.innerHTML += `
        <div style="margin-bottom: 12px;">
          <strong>You:</strong>
          <span>${esc(message)}</span>
        </div>
      `;

      input.value = '';
      input.disabled = true;

      messages.innerHTML += `
        <div id="chat-loading" style="margin-bottom: 12px;">
          <strong>SaaSOptima:</strong>
          <span>Thinking…</span>
        </div>
      `;

      messages.scrollTop = messages.scrollHeight;

      try {
        const response = await api.chat(
          message,
          state.chatSessionId
        );

        state.chatSessionId = response.session_id;

        document
          .querySelector('#chat-loading')
          ?.remove();

        messages.innerHTML += `
          <div style="margin-bottom: 12px;">
            <strong>SaaSOptima:</strong>
            <span>${esc(response.reply)}</span>
          </div>
        `;

        messages.scrollTop = messages.scrollHeight;
      } catch (error) {
        document
          .querySelector('#chat-loading')
          ?.remove();

        messages.innerHTML += `
          <div style="margin-bottom: 12px;">
            <strong>Error:</strong>
            <span>${esc(error.message)}</span>
          </div>
        `;
      } finally {
        input.disabled = false;
        input.focus();
      }
    });
}



function renderNegotiationResult(data) {
  const amount =
    data.final_price == null
      ? 'No final price'
      : formatMoney(data.final_price, data.currency);

  return `
    <div class="neg-result">

      <div class="result-heading">
        <div>
          <span class="eyebrow">
            NEGOTIATION RESULT · #${esc(data.negotiation_id)}
          </span>

          <h3>
            ${esc(data.tool_name)}
            <span class="pill">${esc(data.status)}</span>
          </h3>
        </div>

        <strong class="final-price">
          ${amount}
        </strong>
      </div>

      <div class="result-summary">
        <div>
          <span>Base price</span>
          <strong>
            ${formatMoney(data.base_price, data.currency)}
          </strong>
        </div>

        <div>
          <span>Buyer budget</span>
          <strong>
            ${formatMoney(data.buyer_budget, data.currency)}
          </strong>
        </div>

        <div>
          <span>Savings</span>
          <strong>
            ${
              data.savings_percent == null
                ? '—'
                : `${esc(data.savings_percent)}%`
            }
          </strong>
        </div>

        <div>
          <span>Deal score</span>
          <strong>
            ${
              data.deal_score == null
                ? '—'
                : esc(data.deal_score)
            }
          </strong>
        </div>
      </div>

      ${
        data.history?.length
          ? `
            <h4>Negotiation activity</h4>

            <ol class="history-list">
              ${data.history
                .map(
                  (item) => `
                    <li>
                      <span>${esc(item.agent || 'Agent')}</span>
                      <strong>${esc(item.action || 'Action')}</strong>
                      ${
                        item.offer == null
                          ? ''
                          : `<span>${formatMoney(
                              item.offer,
                              data.currency
                            )}</span>`
                      }
                    </li>
                  `
                )
                .join('')}
            </ol>
          `
          : ''
      }

      <div class="form-action">
        <button
          class="button primary"
          id="generate-email"
          type="button"
        >
          Generate Email <span>✉</span>
        </button>
      </div>

      <div id="email-result"></div>

    </div>
  `;
}


/* =========================================================
   ROUTING
   ========================================================= */

window.addEventListener(
  'hashchange',
  () =>
    renderPage(
      location.hash.slice(1) || 'overview'
    )
);

renderPage(
  location.hash.slice(1) || 'overview'
);

function bindEmailButton() {
  document
    .querySelector('#generate-email')
    ?.addEventListener('click', async () => {
      const button = document.querySelector('#generate-email');
      const result = document.querySelector('#email-result');

      button.disabled = true;
      result.innerHTML = loading('Generating negotiation email…');

      try {
        const email = await api.email(
          state.negotiation.negotiation_id
        );

        result.innerHTML = `
          <div class="panel">
            <h4>Generated Email</h4>

            <p>
              <strong>Subject:</strong>
              ${esc(email.subject)}
            </p>

            <div class="state-card">
              <pre style="
                white-space: pre-wrap;
                font-family: inherit;
                margin: 0;
              ">${esc(email.body)}</pre>
            </div>
          </div>
        `;
      } catch (error) {
        result.innerHTML = errorBox(error);
      } finally {
        button.disabled = false;
      }
    });
}


async function renderMyStack() {
  const companyName = state.user.company;

  shell(loading('Loading your company stack…'));

  try {
    const [tools, subscriptions, summary, overlap] = await Promise.all([
      api.tools(),
      api.companyTools(companyName),
      api.companySummary(companyName),
      api.companyOverlap(companyName, 0),
    ]);

    console.log("Company overlap:", overlap);

    state.tools = tools;

        // Generate visual Optimization Insights
    const highOverlap = overlap.filter(item => item.similarity >= 60);
    const moderateOverlap = overlap.filter(
      item => item.similarity >= 30 && item.similarity < 60
    );
    const lowOverlap = overlap.filter(item => item.similarity < 30);

    const spendingData = subscriptions.map(sub => {
      const tool = tools.find(t => t.id === sub.tool_id);
      const monthlyCost =
        sub.billing_cycle === 'annually'
          ? (sub.seats * sub.price_per_seat) / 12
          : sub.seats * sub.price_per_seat;

      return {
        name: tool?.name || `Tool #${sub.tool_id}`,
        cost: monthlyCost,
        currency: sub.currency,
      };
    }).sort((a, b) => b.cost - a.cost);

        const maxSpend = Math.max(...spendingData.map(item => item.cost), 1);

    let insightsHTML = '';

    if (subscriptions.length === 0) {
      insightsHTML = `
        <div class="panel optimization-panel">
          <div class="optimization-header">
            <h2><i class="fa-solid fa-wand-magic-sparkles"></i> Optimization Insights</h2>
          </div>
          <div class="empty-insights">
            <i class="fa-solid fa-chart-pie"></i>
            <h3>Your insights are waiting</h3>
            <p>Add subscriptions to unlock your company's spending and overlap analysis.</p>
          </div>
        </div>
      `;
    } else {
      insightsHTML = `
        <div class="panel optimization-panel">

          <div class="optimization-header">
            <div>
              <h2><i class="fa-solid fa-wand-magic-sparkles"></i> Optimization Insights</h2>
              <p>Visual analysis of your company's SaaS stack</p>
            </div>
            <span class="analysis-badge">Stack analysis</span>
          </div>

          <div class="insight-metrics">

            <div class="insight-metric metric-spend">
              <div class="metric-icon"><i class="fa-solid fa-wallet"></i></div>
              <span>Monthly spending</span>
              <strong>${formatMoney(summary.monthly_spend)}</strong>
              <small>Estimated recurring spend</small>
            </div>

            <div class="insight-metric metric-tools">
              <div class="metric-icon"><i class="fa-solid fa-layer-group"></i></div>
              <span>Subscriptions</span>
              <strong>${summary.total_subscriptions}</strong>
              <small>Active entries in your stack</small>
            </div>

            <div class="insight-metric metric-seats">
              <div class="metric-icon"><i class="fa-solid fa-users"></i></div>
              <span>Total seats</span>
              <strong>${summary.total_seats}</strong>
              <small>Across your subscriptions</small>
            </div>

          </div>

          <div class="insight-visual-grid">

            <div class="insight-visual-card">
              <div class="visual-heading">
                <h3><i class="fa-solid fa-chart-bar"></i> Spending breakdown</h3>
                <p>Monthly cost by subscription</p>
              </div>

              <div class="spending-bars">
                ${spendingData.map(item => `
                  <div class="spending-row">
                    <div class="spending-label">
                      <span>${esc(item.name)}</span>
                      <strong>${formatMoney(item.cost, item.currency)}</strong>
                    </div>
                    <div class="spending-track">
                      <div class="spending-fill"
                        style="width:${(item.cost / maxSpend) * 100}%">
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="insight-visual-card overlap-summary-card">
              <div class="visual-heading">
                <h3><i class="fa-solid fa-code-compare"></i> Feature overlap</h3>
                <p>Similarity analysis across subscribed tools</p>
              </div>

              <div class="overlap-status-list">
                <div class="overlap-status-item">
                  <span class="status-dot status-high"></span>
                  <span>High overlap</span>
                  <strong>${highOverlap.length}</strong>
                </div>

                <div class="overlap-status-item">
                  <span class="status-dot status-moderate"></span>
                  <span>Moderate overlap</span>
                  <strong>${moderateOverlap.length}</strong>
                </div>

                <div class="overlap-status-item">
                  <span class="status-dot status-low"></span>
                  <span>Low overlap</span>
                  <strong>${lowOverlap.length}</strong>
                </div>
              </div>

              <div class="overlap-summary-footer">
                <i class="fa-solid fa-circle-info"></i>
                ${overlap.length} pair(s) analysed based on feature similarity.
              </div>
            </div>

          </div>

          <div class="pair-analysis-section">
            <div class="visual-heading">
              <h3><i class="fa-solid fa-diagram-project"></i> Tool similarity</h3>
              <p>Compare overlapping features between subscriptions</p>
            </div>

            ${
              overlap.length
                ? overlap.map(item => {
                    const level =
                      item.similarity >= 60 ? 'high' :
                      item.similarity >= 30 ? 'moderate' : 'low';

                    return `
                      <div class="similarity-row">
                        <div class="similarity-top">
                          <div class="similarity-names">
                            <span>${esc(item.tool_a)}</span>
                            <i class="fa-solid fa-arrow-right-arrow-left"></i>
                            <span>${esc(item.tool_b)}</span>
                          </div>
                          <span class="similarity-value ${level}">
                            ${esc(item.similarity)}%
                          </span>
                        </div>

                        <div class="similarity-track">
                          <div class="similarity-fill ${level}"
                            style="width:${Math.min(Math.max(item.similarity, 0), 100)}%">
                          </div>
                        </div>

                        <div class="similarity-description">
                          ${
                            level === 'high'
                              ? 'High similarity · Review potential consolidation'
                              : level === 'moderate'
                                ? 'Partial similarity · Review shared functionality'
                                : 'Low similarity · No consolidation suggestion'
                          }
                        </div>
                      </div>
                    `;
                  }).join('')
                : `<div class="empty-overlap">No tool pairs to compare yet.</div>`
            }
          </div>

          <div class="insight-recommendations">
            <div class="insight-recommendation-banner">
              <div class="recommendation-icon">
                <i class="fa-solid fa-lightbulb"></i>
              </div>
              <div>
                <strong>Consolidation review</strong>
                <p>
                  ${
                    highOverlap.length
                      ? `${highOverlap.length} high-similarity pair(s) detected. Review whether both tools are necessary before making changes.`
                      : 'No pairs currently cross the high-similarity threshold. No immediate consolidation flags were identified.'
                  }
                </p>
              </div>
            </div>

            ${
              moderateOverlap.length
                ? `
                  <div class="insight-recommendation-banner moderate-banner">
                    <div class="recommendation-icon">
                      <i class="fa-solid fa-magnifying-glass"></i>
                    </div>
                    <div>
                      <strong>Partial functionality overlap</strong>
                      <p>${moderateOverlap.length} pair(s) share some features. Check whether those features are being used by your team.</p>
                    </div>
                  </div>
                `
                : ''
            }
          </div>

          <div class="insight-disclaimer">
            <i class="fa-solid fa-circle-info"></i>
            Similarity is based on feature matching, not actual usage.
            Review your team's needs before cancelling any subscription.
          </div>

        </div>
      `;
    }

    shell(`
      <div class="welcome">
        <div>
          <div class="eyebrow light">YOUR COMPANY WORKSPACE</div>
          <h2>Manage your SaaS stack.</h2>
          <p>Add your subscriptions, track spending and identify optimization opportunities.</p>
        </div>
        <div class="welcome-art"><span>✳</span><i></i><b></b></div>
      </div>

      <div class="stat-grid">
        ${stat('Subscriptions', summary.total_subscriptions, 'Tools in your company stack')}
        ${stat('Total seats', summary.total_seats, 'Across your subscriptions')}
        ${stat('Monthly spend', formatMoney(summary.monthly_spend), 'Estimated monthly expenditure')}
        ${stat('Annual spend', formatMoney(summary.annual_spend), 'Estimated yearly expenditure')}
      </div>

      ${insightsHTML}

      <div class="panel">
        <div class="section-heading">
          <div>
            <h2>Add a subscription</h2>
            <p>Enter the plan and billing details your company actually pays.</p>
          </div>
        </div>

        <form id="stack-form" class="form-grid">

          <label>
            SaaS tool
            <select name="tool_id" required>
              ${tools.map(tool => `
                <option value="${tool.id}">
                  ${esc(tool.name)} (${esc(tool.category)})
                </option>
              `).join('')}
            </select>
          </label>

          <label>
            Plan name
            <input name="plan_name" placeholder="e.g. Pro, Business" required />
          </label>

          <label>
            Number of seats
            <input name="seats" type="number" min="1" value="1" required />
          </label>

          <label>
            Price per seat
            <input name="price_per_seat" type="number" min="0" step="0.01" placeholder="e.g. 750" required />
          </label>

          <label>
            Currency
            <select name="currency">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </label>

          <label>
            Billing cycle
            <select name="billing_cycle">
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </label>

          <div class="form-action">
            <button class="button primary" type="submit">
              Add to company stack →
            </button>
          </div>

        </form>

        <div id="stack-form-result"></div>
      </div>

      <div class="section-heading">
        <div>
          <h2>Your subscriptions</h2>
          <p>Review and manage the SaaS tools your company uses.</p>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>TOOL</th>
              <th>PLAN</th>
              <th>SEATS</th>
              <th>PRICE / SEAT</th>
              <th>BILLING</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody id="stack-rows">
            ${
              subscriptions.length
                ? subscriptions.map(item => `
                    <tr>
                      <td><strong>${esc(item.tool_name)}</strong></td>
                      <td>${esc(item.plan_name)}</td>
                      <td>${esc(item.seats)}</td>
                      <td>${formatMoney(item.price_per_seat, item.currency)}</td>
                      <td><span class="pill">${esc(item.billing_cycle)}</span></td>
                      <td>
                        <button
                          class="button secondary remove-stack"
                          data-id="${item.subscription_id}"
                          type="button"
                        >Remove</button>
                      </td>
                    </tr>
                  `).join('')
                : `<tr><td colspan="6" class="table-empty">No subscriptions added yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <p class="note">
        Spending totals assume the subscriptions are entered correctly.
        Avoid combining different currencies in the same company summary.
      </p>
    `);

    // Add a subscription
    document.querySelector('#stack-form')
      .addEventListener('submit', async (event) => {
        event.preventDefault();

        const form = new FormData(event.currentTarget);
        const result = document.querySelector('#stack-form-result');

        const body = {
          tool_id: Number(form.get('tool_id')),
          company_name: companyName,
          plan_name: String(form.get('plan_name')).trim(),
          seats: Number(form.get('seats')),
          price_per_seat: Number(form.get('price_per_seat')),
          currency: form.get('currency'),
          billing_cycle: form.get('billing_cycle'),
        };

        result.innerHTML = loading('Adding subscription…');

        try {
          const response = await api.addCompanyTool(body);

          if (response.error) throw new Error(response.error);

          await renderMyStack();
        } catch (error) {
          result.innerHTML = errorBox(error);
        }
      });

    // Remove subscriptions
    document.querySelectorAll('.remove-stack')
      .forEach(button => {
        button.addEventListener('click', async () => {
          const id = Number(button.dataset.id);

          button.disabled = true;

          try {
            await api.removeCompanyTool(id);
            await renderMyStack();
          } catch (error) {
            button.disabled = false;
            alert(error.message);
          }
        });
      });

  } catch (error) {
    shell(errorBox(error, renderMyStack));
    bindRetry(renderMyStack);
  }
}
