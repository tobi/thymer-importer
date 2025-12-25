# Thymer Plugin SDK Reference Files

When working on Thymer plugins, reference these files for detailed API documentation:

## Core SDK Files
- `thymer-plugin-sdk/types.d.ts` - Complete TypeScript definitions with all APIs
- `thymer-plugin-sdk/README.md` - Setup and development workflow
- `thymer-plugin-sdk/plugin.js` - Starter template
- `thymer-plugin-sdk/plugin.json` - Configuration template

## Example Plugins

### App Plugins (Global)
- `thymer-plugin-sdk/examples/app-plugins/clock/` - Status bar clock
- `thymer-plugin-sdk/examples/app-plugins/weather/` - Weather widget
- `thymer-plugin-sdk/examples/app-plugins/css/` - Custom CSS injection
- `thymer-plugin-sdk/examples/app-plugins/robot-cursor/` - Custom cursor with assets

### Collection Plugins
- `thymer-plugin-sdk/examples/collection-plugins/simple-list-view/` - Custom view basics
- `thymer-plugin-sdk/examples/collection-plugins/kanban-wip/` - Board render hooks
- `thymer-plugin-sdk/examples/collection-plugins/kanban-dependencies/` - Board dependencies
- `thymer-plugin-sdk/examples/collection-plugins/kanban-card-button/` - Card buttons
- `thymer-plugin-sdk/examples/collection-plugins/custom-prop-render/` - Property rendering
- `thymer-plugin-sdk/examples/collection-plugins/table-custom-sort/` - Custom sorting
- `thymer-plugin-sdk/examples/collection-plugins/table-id-constraint/` - Unique constraints
- `thymer-plugin-sdk/examples/collection-plugins/real-time-property/` - Live updates
- `thymer-plugin-sdk/examples/collection-plugins/globe-view/` - Complex custom view
- `thymer-plugin-sdk/examples/collection-plugins/org-chart/` - Organogram view

## Reading Examples
When asked to implement a specific feature, read the relevant example first:
- For status bar items: read clock example
- For custom views: read simple-list-view example
- For board modifications: read kanban-wip example
- For property formulas: read custom-prop-render example
