(function bootstrapPortfolioWidget() {
  const data = window.PORTFOLIO_WIDGET_DATA;

  if (!data) {
    throw new Error("Portfolio widget data is missing.");
  }

  const defaultHorizonId = data.horizons[0]?.id || null;
  const defaultRoleCode = data.roles.find((role) => role.horizon === defaultHorizonId)?.code || data.roles[0]?.code || null;

  const state = {
    search: "",
    selectedHorizonId: defaultHorizonId,
    selectedRoleCode: defaultRoleCode,
    platform: detectPlatformContext(),
  };

  const elements = {
    portfolioTitle: document.getElementById("portfolioTitle"),
    portfolioDescription: document.getElementById("portfolioDescription"),
    primaryActionBtn: document.getElementById("primaryActionBtn"),
    secondaryActionBtn: document.getElementById("secondaryActionBtn"),
    projectCountValue: document.getElementById("projectCountValue"),
    focusAreaCountValue: document.getElementById("focusAreaCountValue"),
    featuredCountValue: document.getElementById("featuredCountValue"),
    lastUpdatedValue: document.getElementById("lastUpdatedValue"),
    widgetModeValue: document.getElementById("widgetModeValue"),
    widgetModeDescription: document.getElementById("widgetModeDescription"),
    searchInput: document.getElementById("searchInput"),
    focusFilters: document.getElementById("focusFilters"),
    projectGrid: document.getElementById("projectGrid"),
    detailTitle: document.getElementById("detailTitle"),
    detailStatusPill: document.getElementById("detailStatusPill"),
    detailSummary: document.getElementById("detailSummary"),
    detailMeta: document.getElementById("detailMeta"),
    detailHighlights: document.getElementById("detailHighlights"),
    detailLinks: document.getElementById("detailLinks"),
    resourceList: document.getElementById("resourceList"),
    milestoneList: document.getElementById("milestoneList"),
    platformNotice: document.getElementById("platformNotice"),
    platformContextGrid: document.getElementById("platformContextGrid"),
  };

  initialize();

  function initialize() {
    wireEvents();
    renderPortfolioHeader();
    renderHorizonCards();
    renderRoleList();
    renderSelectedRole();
    renderResources();
    renderMilestones();
    renderPlatformContext();
  }

  function wireEvents() {
    elements.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value.trim().toLowerCase();
      renderRoleList();
    });
  }

  function renderPortfolioHeader() {
    const { portfolio, horizons, roles } = data;
    const primaryApps = data.roleApps.filter((entry) => entry.primary);

    elements.portfolioTitle.textContent = portfolio.title;
    elements.portfolioDescription.textContent = portfolio.description;
    elements.projectCountValue.textContent = String(horizons.length);
    elements.focusAreaCountValue.textContent = String(roles.length);
    elements.featuredCountValue.textContent = String(primaryApps.length);
    elements.lastUpdatedValue.textContent = formatDate(portfolio.lastUpdated);
    elements.widgetModeValue.textContent = state.platform.modeLabel;
    elements.widgetModeDescription.textContent = state.platform.description;

    configureActionButton(elements.primaryActionBtn, portfolio.primaryAction);
    configureActionButton(elements.secondaryActionBtn, portfolio.secondaryAction);
  }

  function renderHorizonCards() {
    elements.focusFilters.innerHTML = data.horizons
      .map((horizon) => {
        const roleCount = getRolesForHorizon(horizon.id).length;
        return `
          <button class="horizon-card ${horizon.id === state.selectedHorizonId ? "is-active" : ""}" type="button" data-horizon-id="${horizon.id}">
            <span class="status-label">${escapeHtml(horizon.label)}</span>
            <strong>${escapeHtml(horizon.name)}</strong>
            <p>${escapeHtml(horizon.description)}</p>
            <span class="horizon-meta">${roleCount} roles</span>
          </button>
        `;
      })
      .join("");

    [...elements.focusFilters.querySelectorAll("[data-horizon-id]")].forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedHorizonId = button.dataset.horizonId;
        const firstRole = getFilteredRolesForCurrentHorizon()[0] || getRolesForHorizon(state.selectedHorizonId)[0] || null;
        state.selectedRoleCode = firstRole?.code || null;
        renderHorizonCards();
        renderRoleList();
        renderSelectedRole();
      });
    });
  }

  function renderRoleList() {
    const roles = getFilteredRolesForCurrentHorizon();

    if (!roles.some((role) => role.code === state.selectedRoleCode)) {
      state.selectedRoleCode = roles[0]?.code || getRolesForHorizon(state.selectedHorizonId)[0]?.code || null;
    }

    if (!roles.length) {
      elements.projectGrid.innerHTML = `
        <article class="empty-state-card">
          <h3>No roles match this view</h3>
          <p>Try clearing the search term or choosing a different horizon.</p>
        </article>
      `;
      renderSelectedRole();
      return;
    }

    elements.projectGrid.innerHTML = roles
      .map((role) => {
        const primaryAppCount = getRoleApps(role.code).filter((entry) => entry.primary).length;
        const totalAppCount = getRoleApps(role.code).length;

        return `
          <article class="project-card ${role.code === state.selectedRoleCode ? "is-selected" : ""}" data-role-code="${role.code}">
            <div class="card-topline">
              <span class="status-pill">${escapeHtml(role.code)}</span>
              <span class="feature-badge">${escapeHtml(role.domain)}</span>
            </div>
            <h3>${escapeHtml(role.name)}</h3>
            <p>${escapeHtml(role.summary)}</p>
            <div class="meta-row">
              <span>${escapeHtml(role.subDomain)}</span>
              <span>${primaryAppCount} primary apps</span>
            </div>
            <div class="tag-row">
              <span class="tag">${totalAppCount} total apps</span>
              <span class="tag">${escapeHtml(getHorizonById(role.horizon)?.label || "")}</span>
            </div>
          </article>
        `;
      })
      .join("");

    [...elements.projectGrid.querySelectorAll("[data-role-code]")].forEach((card) => {
      card.addEventListener("click", () => {
        state.selectedRoleCode = card.dataset.roleCode;
        renderRoleList();
        renderSelectedRole();
      });
    });

    renderSelectedRole();
  }

  function renderSelectedRole() {
    const role = getSelectedRole();

    if (!role) {
      elements.detailTitle.textContent = "Select a role";
      elements.detailStatusPill.textContent = "Preview";
      elements.detailSummary.textContent = "Choose a role to inspect its primary apps and the other roles those apps appear in.";
      elements.detailMeta.innerHTML = "";
      elements.detailHighlights.innerHTML = "";
      elements.detailLinks.innerHTML = "";
      return;
    }

    const memberships = getRoleApps(role.code);
    const primaryMemberships = memberships.filter((entry) => entry.primary);
    const secondaryMemberships = memberships.filter((entry) => !entry.primary);

    elements.detailTitle.textContent = `${role.code} - ${role.name}`;
    elements.detailStatusPill.textContent = getHorizonById(role.horizon)?.label || "Role";
    elements.detailSummary.textContent = role.summary;
    elements.detailMeta.innerHTML = [
      { label: "Domain", value: role.domain },
      { label: "Sub-Domain", value: role.subDomain },
      { label: "Primary Apps", value: String(primaryMemberships.length) },
      { label: "All Apps", value: String(memberships.length) },
    ]
      .map(
        (entry) => `
          <div class="meta-item">
            <span class="meta-label">${escapeHtml(entry.label)}</span>
            <strong>${escapeHtml(entry.value)}</strong>
          </div>
        `
      )
      .join("");

    elements.detailHighlights.innerHTML = [
      `Horizon placement: ${getHorizonById(role.horizon)?.name || "Unknown"}`,
      `Primary apps emphasized for ${role.code}: ${primaryMemberships.map((entry) => getAppById(entry.appId)?.name).filter(Boolean).join(", ") || "None yet"}`,
      `Cross-role reuse is visible per app so sellers can see where the same platform capabilities appear elsewhere.`,
    ]
      .map((highlight) => `<li>${escapeHtml(highlight)}</li>`)
      .join("");

    elements.detailLinks.innerHTML = [
      renderMembershipBlock("Primary Apps", primaryMemberships, true),
      renderMembershipBlock("Other Included Apps", secondaryMemberships, false),
    ].join("");
  }

  function renderMembershipBlock(title, memberships, primary) {
    if (!memberships.length) {
      return `
        <section class="detail-app-section">
          <div class="detail-app-heading">
            <strong>${escapeHtml(title)}</strong>
          </div>
          <div class="empty-inline">No apps mapped yet.</div>
        </section>
      `;
    }

    return `
      <section class="detail-app-section">
        <div class="detail-app-heading">
          <strong>${escapeHtml(title)}</strong>
          <span class="tag">${memberships.length}</span>
        </div>
        <div class="link-stack">
          ${memberships
            .map((membership) => {
              const app = getAppById(membership.appId);
              return `
                <article class="resource-card compact-card app-membership-card ${primary ? "is-primary-membership" : ""}">
                  <div>
                    <strong>${escapeHtml(app?.name || membership.appId)}</strong>
                    <p>${primary ? "Primary app for this role" : "Also included in this role"}</p>
                    <div class="tag-row">
                      ${membership.sharedWith
                        .map((roleCode) => `<span class="tag">${escapeHtml(roleCode)}</span>`)
                        .join("")}
                    </div>
                  </div>
                  <span class="link-arrow">Shared Roles</span>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  function renderResources() {
    const selectedRole = getSelectedRole();
    const resources = [
      {
        type: "Native Fit",
        title: "Dashboard Widget Shell",
        description: "Host this as a web app and register it as a custom 3DDashboard widget for the first native-feeling rollout.",
      },
      {
        type: "Data Layer",
        title: "Role-App Join Model",
        description: "The join table behind this prototype mirrors the Notion relationship you showed: role to app, plus shared-role visibility.",
      },
      {
        type: "Pilot",
        title: selectedRole ? `Start With ${selectedRole.code}` : "Start With X1G",
        description: "Use one well-known role first, confirm the flow in a tenant, then backfill the rest of the database.",
      },
    ];

    elements.resourceList.innerHTML = resources
      .map(
        (resource) => `
          <article class="resource-card">
            <div>
              <span class="status-label">${escapeHtml(resource.type)}</span>
              <strong>${escapeHtml(resource.title)}</strong>
              <p>${escapeHtml(resource.description)}</p>
            </div>
            <span class="link-arrow">Ready</span>
          </article>
        `
      )
      .join("");
  }

  function renderMilestones() {
    const milestones = [
      {
        due: "Now",
        title: "Validate Horizon Browser UX",
        summary: "Confirm the three-card horizon entry point and the role-to-app drilldown feel right for internal users.",
      },
      {
        due: "Next",
        title: "Import Notion Source Data",
        summary: "Replace the mocked role-app rows with the real exported database once you have access to it.",
      },
      {
        due: "Tenant Test",
        title: "Register As Widget",
        summary: "Host the widget over HTTPS, add it to a pilot tenant dashboard, and wire real widget lifecycle/context hooks.",
      },
    ];

    elements.milestoneList.innerHTML = milestones
      .map(
        (milestone) => `
          <article class="milestone-card">
            <span class="status-pill">${escapeHtml(milestone.due)}</span>
            <h3>${escapeHtml(milestone.title)}</h3>
            <p>${escapeHtml(milestone.summary)}</p>
          </article>
        `
      )
      .join("");
  }

  function renderPlatformContext() {
    const entries = [
      { label: "Container", value: state.platform.container },
      { label: "Tenant", value: state.platform.tenant },
      { label: "Collaborative Space", value: state.platform.space },
      { label: "User", value: state.platform.user },
      { label: "Widget Registration", value: "Hosted URL -> custom dashboard widget" },
      { label: "Next Step", value: state.platform.nextStep },
    ];

    elements.platformNotice.textContent = state.platform.notice;
    elements.platformContextGrid.innerHTML = entries
      .map(
        (entry) => `
          <article class="context-card">
            <span class="meta-label">${escapeHtml(entry.label)}</span>
            <strong>${escapeHtml(entry.value)}</strong>
          </article>
        `
      )
      .join("");
  }

  function getFilteredRolesForCurrentHorizon() {
    return getRolesForHorizon(state.selectedHorizonId).filter((role) => {
      const haystack = [role.code, role.name, role.domain, role.subDomain, role.summary].join(" ").toLowerCase();
      return !state.search || haystack.includes(state.search);
    });
  }

  function getRolesForHorizon(horizonId) {
    return data.roles.filter((role) => role.horizon === horizonId);
  }

  function getRoleApps(roleCode) {
    return data.roleApps.filter((entry) => entry.roleCode === roleCode);
  }

  function getSelectedRole() {
    return data.roles.find((role) => role.code === state.selectedRoleCode) || null;
  }

  function getHorizonById(horizonId) {
    return data.horizons.find((horizon) => horizon.id === horizonId) || null;
  }

  function getAppById(appId) {
    return data.apps.find((app) => app.id === appId) || null;
  }

  function configureActionButton(button, action) {
    button.textContent = action.label;
    button.addEventListener("click", () => {
      if (!action?.href) {
        return;
      }

      if (action.external !== false) {
        window.open(action.href, "_blank", "noreferrer");
        return;
      }

      window.location.href = action.href;
    });
  }

  function detectPlatformContext() {
    const widgetGlobal = window.widget || window.WIDGET || null;
    const hasContainerSignals =
      Boolean(widgetGlobal) ||
      Boolean(window.dsService) ||
      Boolean(window.i3DXCompassServices) ||
      window.location.search.includes("tenant=");

    if (hasContainerSignals) {
      return {
        modeLabel: "3DEXPERIENCE Candidate",
        description: "Container signals detected. Replace placeholder values with real tenant-aware hooks next.",
        container: widgetGlobal ? "Widget API detected" : "Container signals detected",
        tenant: readPotentialTenant(),
        space: "Resolve from tenant credentials or widget preferences",
        user: "Resolve from platform identity service",
        nextStep: "Bind actual widget APIs, identity, and any deep links your tenant expects.",
        notice: "Native rollout path: host the app, register it as a custom dashboard widget, then attach real lifecycle and identity services.",
      };
    }

    return {
      modeLabel: "Browser Preview",
      description: "Running outside the 3DEXPERIENCE container with mock context.",
      container: "Standalone browser",
      tenant: "Mock tenant",
      space: "Mock collaborative space",
      user: "Local preview user",
      nextStep: "Host these files over HTTPS and register the URL in a pilot tenant dashboard.",
      notice: "This prototype already follows the core shape of a native-feeling 3DDashboard widget: hosted UI, tenant registration, then platform context binding.",
    };
  }

  function readPotentialTenant() {
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant") || params.get("platformTenant") || "Detected via URL or widget config";
  }

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
