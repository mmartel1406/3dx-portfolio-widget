# 3DEXPERIENCE Portfolio Widget Prototype

This folder contains a static prototype for a custom `3DDashboard` portfolio widget.

## Files

- `index.html` - widget shell markup
- `styles.css` - horizon, role, and app-browser UI styling
- `data.js` - sample horizon, role, app, and role-app membership data
- `app.js` - horizon selection, role detail rendering, and platform context detection

## What This Prototype Proves

- a Notion-style portfolio database can be reshaped into a horizon -> role -> app browser
- the widget can run as a simple hosted web app first
- the relational content model can stay separate from platform integration
- we have clear seams for tenant awareness, user context, and platform deep links

## Local Preview

Open `index.html` in a browser or host this folder with any static web server.

## Recommended Next Steps For Tenant Testing

1. Host this folder on an internal HTTPS endpoint.
2. Replace the mocked role-app rows in `data.js` with the real Notion export.
3. Register the hosted URL as a custom dashboard widget in a pilot tenant.
4. Replace the mock platform context values in `app.js` with tenant-specific widget and identity hooks.
5. Decide whether content should remain JSON-driven or move to a lightweight backend.

## Native Rollout Shape

This becomes a native-feeling 3DEXPERIENCE app by:

1. Hosting the widget files on an HTTPS endpoint you control.
2. Registering that hosted page as a custom `3DDashboard` widget in your tenant.
3. Letting the platform frame/load the widget inside the dashboard container.
4. Adding widget lifecycle hooks, tenant context, and identity services in `app.js`.

The first version does not need deep platform APIs to feel native. Registration, dashboard placement, tenant-safe links, and container-aware behavior usually get you most of the way there.

## Suggested Phase 2

- import the real Notion source database
- add admin-editable role and app metadata
- connect to 3DEXPERIENCE user and tenant context
- support deep links into 3DSpace, 3DDrive, or other platform apps
