# LiveKit Sandbox App Setup

Steps to finish setting up your LiveKit sandbox app **polyglot-stack-2mt1l9** and run it locally.

---

## 1. CLI (done)

LiveKit CLI is installed via Homebrew:

```bash
brew install livekit-cli
```

Verify:

```bash
lk --version
```

---

## 2. Authenticate with LiveKit Cloud

You must authenticate once so the CLI can talk to your LiveKit Cloud project and sandbox.

**Run in your terminal (interactive):**

```bash
lk cloud auth
```

- A browser window will open for LiveKit Cloud login.
- When prompted, give this machine a **device name** (e.g. `MacBook` or `m10dj-dev`).
- If you see `400 Bad Request`, try again; ensure you’re logged into the correct LiveKit Cloud account and that the device name is valid (no empty name).

After success, the CLI will have a local project linked and you can run sandbox commands.

---

## 3. Bootstrap the sandbox app

From your project root (or the directory where you want the app):

```bash
lk app create --sandbox polyglot-stack-2mt1l9
```

This clones the template linked to your sandbox and wires it to your LiveKit project. It will create a new directory (name depends on the template; often the template name, e.g. `polyglot-stack` or similar).

---

## 4. Install and run the app

```bash
cd <directory-created-in-step-3>
npm install
npm run dev
```

(Use the exact folder name and scripts shown in that directory’s README if different.)

---

## 5. Launch and test

- Open the URL shown by `npm run dev` (e.g. `http://localhost:3000`).
- Use the Sandboxes page in [LiveKit Cloud](https://cloud.livekit.io/projects/p_/sandbox) to open or manage **polyglot-stack-2mt1l9** and follow any “Code” tab instructions for that template.

---

# Agent deployment

Deploy agents to LiveKit Cloud so they run on LiveKit’s infrastructure with automatic scaling. Use the same CLI and auth as above.

## Setup (same as sandbox)

1. **Install CLI:** `brew install livekit-cli`
2. **Authenticate:** `lk cloud auth` (interactive; use a device name when prompted)

## Optional: use a starter template

Create a local app from a template (e.g. Python agent starter), then enter the directory:

```bash
lk app create --template agent-starter-python <my-app>
cd <my-app>
```

Replace `<my-app>` with your app directory name.

## Create a new deployable agent

From your agent app directory (or after creating one):

```bash
lk agent create
```

This sets up a new deployable agent and links it to your LiveKit Cloud project. Use the [Agents dashboard](https://cloud.livekit.io/projects/p_/agents) for configuration, monitoring, and logs.

## Agent deployment docs

- [Agent deployment overview](https://docs.livekit.io/deploy/agents.md) – configuration, monitoring, logs
- [Get started](https://docs.livekit.io/deploy/agents/start.md) – quickstart
- [Deployment management](https://docs.livekit.io/deploy/agents/managing-deployments.md)
- [Secrets](https://docs.livekit.io/deploy/agents/secrets.md), [Logs](https://docs.livekit.io/deploy/agents/logs.md), [Builds and Dockerfiles](https://docs.livekit.io/deploy/agents/builds.md)

---

## Reference

- [LiveKit Sandbox docs](https://docs.livekit.io/deploy/admin/sandbox)
- [LiveKit CLI](https://docs.livekit.io/intro/basics/cli)
