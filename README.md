
![Quantum Metric Logo](./images/logo.png)
# Analytics Module: Quantum Metric

Welcome to the Quantum Metric Analytics Plugin for Backstage! This plugin aims to provide a quick and robust means to
integrate Quantum Metric analytics with your Backstage instance.

## Installation

1. Install the plugin:

```bash
yarn --cwd packages/app add @qm/plugin-analytics-module-qm
```

2. Open the `packages/app/src/apis.ts` file and import the required dependencies::

```JS
import {
  analyticsApiRef,
  configApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { QuantumMetric } from '@qm/plugin-analytics-module-qm';

```

3. Next, add the following code to `packages/app/src/apis.ts` to create the Quantum Metric Analytics API:

```JS
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef, identityApi: identityApiRef },
    factory: ({ configApi, identityApi }) =>
      QuantumMetric.fromConfig(configApi, {
        identityApi,
      }),
  }),
```

## Configuration

After installing the plugin, the Quantum Metric Analytics plugin will need to be configured. The options and reference
example are detailed below.

### Configuration Options

The table below lists the available configuration options for the Quantum Metric Analytics plugin:

| Field Name      | Type                                  | Required | Default | Description                                                                                                      |
| --------------- | ------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| enabled         | boolean                               | Yes      |         | Disables plugin.                                                                                                 |
| src             | string                                | Yes      |         | CDN location of Quantum Metric API. The value is `qtm.src` on your subscriptions Install page.                   |
| debug           | boolean                               | No       | `false` | Turns on console.debug messages.                                                                                 |
| test            | boolean                               | No       | `false` | When enabled, events are logged to console instead of sent to Quantum Metric.                                    |
| async           | boolean                               | No       | `false` | Sets the async attribute of the resulting HTML `<script>` element.                                               |
| events.mappings | list of {name: string, id: integer}   | Yes      | `{}`    | Maps Backstage `AnalyticsEvent` actions to Quantum Metric Event ID's as a list of objects with `name` and `id`.  |
| events.attributes      | list of {name: string, value: string} | Yes      | `{}`    | Included on every event sent to Quantum Metric under Event Details as a list of objects with `name` and `value`. |

### Example Configuration

Below is a reference configuration file:

```YAML
app:
analytics:
  qm:
    enabled: true
    src: https://cdn.quantummetric.com/qscripts/quantum-$SUB_NAME.js
    debug: false
    test: false
    async: false
    events:
      mappings:
        - name: navigate
          id: $QUANTUM_NAVIGATE_EVENT_ID
        - name: click
          id: $QUANTUM_CLICK_EVENT_ID
        - name: search
          id: $QUANTUM_SEARCH_EVENT_ID
        - name: discover
          id: $QUANTUM_DISCOVER_EVENT_ID
      attributes:
        - name: environment
          value: development
        - name: version
          value: 0.0.1
```

Where the event mappings IDs are the Quantum Metric event IDs you wish to send.

### Event Transformers

The plugin comes with default Event Transformers for each predefined [Backstage Key
Event](https://backstage.io/docs/plugins/analytics/#key-events). However, you can customize or extend these
transformers. To override a default transformer or add transformers for new actions, modify the Analytics API
configuration as follows:

```JS
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) =>
      QuantumMetric.fromConfig(configApi, {
        eventTransforms: {
          discover: (event, mapping) => {
            return { eventId: mapping[event.action], eventValue: event.attributes.to, attributes: { ...event.attributes, event.subject } };
          },
        },
      }),
  })
```

In the above example, the default transformer for the discover key event is overridden. The value sent to Quantum Metric
is changed to `event.attributes.to` instead of the provided `event.subject`, and the `event.subject` is added as an
attribute.

### Identity

To configure identity from Backstage to Quantum Metric provide the `IdentityAPI` to the plugin like so:

```JS
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi, identityApi }) =>
      QuantumMetric.fromConfig(configApi, {
        identityApi
      }),
  }),
```

This will identify users in Quantum Metric by their Backstage profile email.

### Global Attributes

Global attributes allow you to add attributes to all events sent through the Quantum Metric analytics plugin. When
configured, these attributes will be included in the event details in Quantum Metric.

To configure global attributes, use the following format in your configuration file:

```YAML
app:
  analytics:
    qm:
      events:
        attributes:
          - name: environment
            value: development
          - name: version
            value: 0.0.1
```

With the above configuration, the event details in Quantum Metric will include the following attributes:

```JSON
{
  "environment": "development",
  "version": "0.0.1"
}
```

If the event is generated from Backstage events and includes attributes via the event transformers, those attributes
will also be included along with the global attributes.

For example, if a search event is triggered with the default event transformer it includes the attribute `results-found`
and also has the global attributes configured, the event details will look like this:

```JSON
{
  "results-found": 10,
  "environment": "development",
  "version": "0.0.1"
}
```

Note: In the case of attribute name collisions between global attributes and event-specific attributes, the global
attributes will take precedence and be included in the event details.

## Contributing

Before submitting your pull request, ensure your title follows the semantic commit format. This not only helps our
maintainers but also improves the overall transparency and readability of our project history.

For more detailed contributions guidelines, check our [CONTRIBUTING.md](./CONTRIBUTING.md) file.

### Semantic Commit Messages

In this project, we enforce the use of semantic commit messages to streamline our release and changelog generation
process. This ensures our commit history is readable and understandable.

#### What are Semantic Commit Messages?

Semantic commit messages follow a structured format to clearly describe the purpose and intent of each commit. The
general format is:

- `<type>`: This denotes the kind of change you're making. Common types include `feat` (new features), `fix` (bug
  fixes), `docs` (documentation changes), `style` (code styling, no functional changes), `refactor` (code changes that
  neither fix bugs nor add features), `perf` (performance improvements), `test` (adding missing tests), and `chore`
  (maintenance tasks).

- `<scope>`: A scope provides additional contextual information, such as the part of the codebase affected (optional).

- `<description>`: A brief, imperative mood description of the change.

Examples:

- `feat(auth): implement JWT authentication`
- `fix(server): resolve memory leak issue`
- `docs(readme): update installation instructions`

### Enforcing Semantic Commits

This project uses the [`amannn/action-semantic-pull-request`](https://github.com/amannn/action-semantic-pull-request)
GitHub Action to ensure all pull requests follow the semantic commit format. The action checks your pull request titles,
not the individual commit messages. Make sure your PR titles follow the semantic format.

If your pull request title does not meet the semantic requirements, the check will fail, and you'll need to update the
title accordingly. You can also add multiple types if your pull request covers more than one scope, separated by commas
(e.g., `feat, fix: implement new feature and fix a bug`).

## Contributing

Before submitting your pull request, ensure your title follows the semantic commit format. This not only helps our maintainers but also improves the overall transparency and readability of our project history.

For more detailed contributions guidelines, check our [CONTRIBUTING.md](./CONTRIBUTING.md) file.

### Local Development

1. Install dependencies:

```bash
yarn install
```

2. Build dist folder:

```bash
yarn build
```

3. From your Backstage directory run the following where `$INSTALL_PATH` is the path of this repo:

```bash
yarn add @qm/plugin-analytics-module-qm@link:$INSTALL_PATH
```

Note: If making changes to `config.d.ts` against a Backstage instance started with `backstage-cli package start`,
changes will not take effect till the next `backstage-cli package start`

### Semantic Commit Messages

In this project, we enforce the use of semantic commit messages to streamline our release and changelog generation process. This ensures our commit history is readable and understandable.

#### What are Semantic Commit Messages?

Semantic commit messages follow a structured format to clearly describe the purpose and intent of each commit. The general format is:

- `<type>`: This denotes the kind of change you're making. Common types include `feat` (new features), `fix` (bug fixes), `docs` (documentation changes), `style` (code styling, no functional changes), `refactor` (code changes that neither fix bugs nor add features), `perf` (performance improvements), `test` (adding missing tests), and `chore` (maintenance tasks).

- `<scope>`: A scope provides additional contextual information, such as the part of the codebase affected (optional).

- `<description>`: A brief, imperative mood description of the change.

Examples:

- `feat(auth): implement JWT authentication`
- `fix(server): resolve memory leak issue`
- `chore(readme): update installation instructions`

### Enforcing Semantic Commits

This project uses the [`amannn/action-semantic-pull-request`](https://github.com/amannn/action-semantic-pull-request) GitHub Action to ensure all pull requests follow the semantic commit format. The action checks your pull request titles, not the individual commit messages. Make sure your PR titles follow the semantic format.

If your pull request title does not meet the semantic requirements, the check will fail, and you'll need to update the title accordingly. You can also add multiple types if your pull request covers more than one scope, separated by commas (e.g., `feat, fix: implement new feature and fix a bug`).

### Semantic Versioning

This project uses the [`release-it](https://github.com/release-it/release-it) nodeJS utility to increment software version numbers, automatically create GitHub tags and Releases and auto-publish to`npm`.

Semantic versioning works by interpreting your semantic commit as described in the previous section and assigning it a classification based on the level of severity of the work. That classification then translates into a version number that follows the sequence: `Major.Minor.Patch`.

When a major, minor, or patch update is made, the corresponding number is increased.

- Major version changes when incompatible API changes are made.
- Minor version changes when new functionality is added backward-compatible manner.
- Patch version changes when backward-compatible bug fixes are made.

The table below describes the relationship between the semantic commit message and the semantic version sequence:

| Commit Message                                    | Inferred Type      | Example Sequence Update |
|---------------------------------------------------|--------------------|-------------------------|
| `feat(auth): implement JWT authentication`        | Major              | Yes                     |
| `fix(server): resolve memory leak issue`          | Minor              | Yes                     |
| `chore(readme): update installation instructions` | Patch              | No                      |
