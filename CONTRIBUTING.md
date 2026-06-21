# Contributing to Gemini Desktop

First off, thank you for considering contributing to Gemini Desktop! It's people like you that make this application a fantastic, fast, and native experience for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold a welcoming, respectful, and collaborative environment.

## Getting Started

Gemini Desktop is built with Electron and Node.js. 

### Prerequisites

* [Node.js](https://nodejs.org/) (Version 24 or higher recommended)
* Git

### Local Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gemini-desktop-app.git
   cd gemini-desktop-app
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Run the app in development mode:
   ```bash
   npm start
   ```

### Project Structure

The codebase was recently reorganized for clarity:
* `src/` - The core application source files (`main.js`, `preload.js`, and HTML views).
* `assets/` - The app imagery and icons.
* `scripts/` - Assorted Python utility scripts for image/logo processing.
* `docs/` - The GitHub Pages landing website.
* `.github/workflows/` - The automated CI/CD pipelines.

## Submitting Pull Requests

1. **Create a branch:** `git checkout -b my-new-feature`
2. **Make your changes:** Keep your code clean and ensure the app still runs smoothly.
3. **Commit your changes:** `git commit -m "feat: Add some feature"`
4. **Push to the branch:** `git push origin my-new-feature`
5. **Submit a Pull Request** to the `master` branch.

## Building for Production

If you want to compile the raw native executables locally (instead of using the automated GitHub Actions pipeline):

```bash
npm run dist
```
This will output the compiled binaries (`.exe`, `.dmg`, `.AppImage`, etc.) into the `dist/` directory.

---

*Thank you for helping make Gemini Desktop better!*
