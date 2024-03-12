# Analytics Module: Quantum Metric

Welcome to the Quantum Metric Analytics Provider for Backstage! This plugin aims to provide a quick and robust means to
integrate Quantum Metric analytics with your Backstage instance.

## Quickstart

TODO: Add instructions on how to yarn add the package once its published.

## Installation

### From local

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
yarn add @qm/plugin-analytics-module-qm@file:$INSTALL_PATH
```

## Contributing

Before submitting your pull request, ensure your title follows the semantic commit format. This not only helps our maintainers but also improves the overall transparency and readability of our project history.

For more detailed contributions guidelines, check our [CONTRIBUTING.md](./CONTRIBUTING.md) file.

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
- `docs(readme): update installation instructions`

### Enforcing Semantic Commits

This project uses the [`amannn/action-semantic-pull-request`](https://github.com/amannn/action-semantic-pull-request) GitHub Action to ensure all pull requests follow the semantic commit format. The action checks your pull request titles, not the individual commit messages. Make sure your PR titles follow the semantic format.

If your pull request title does not meet the semantic requirements, the check will fail, and you'll need to update the title accordingly. You can also add multiple types if your pull request covers more than one scope, separated by commas (e.g., `feat, fix: implement new feature and fix a bug`).
