# Gemini Desktop

![Gemini Desktop Banner](./splash.png)

A premium, highly optimized cross-platform desktop wrapper for Google Gemini, built using Electron. This application brings Gemini out of your browser tabs and turns it into a native, powerful desktop assistant for Windows, macOS, and Linux.

## ✨ Features

- **Global Hotkey:** Instantly summon or hide the chat window from anywhere without interrupting your workflow.
  - Windows / Linux: `Alt + Space`
  - macOS: `Command + Option + Space`
- **Always on Top:** Pin the window so you can easily reference Gemini while gaming, coding, or working.
- **Custom Window Sizes:** Switch between Compact, Standard, Tall, and Large presets to perfectly fit your screen.
- **System Tray Integration:** Runs quietly in the background without cluttering your taskbar.
- **Launch on Startup:** Automatically boots silently in the background when you log in, ensuring your hotkey is always ready.
- **Hardware Acceleration Toggle:** Choose between Buttery Smooth GPU rendering or Extreme Battery/RAM Saver mode.
- **Memory Optimized:** Automatically throttles resources and forces garbage collection when hidden to save RAM.
- **Secure External Links:** Clicking external links (like Wikipedia) safely opens your default web browser instead of hijacking the app.

## 📥 Installation

Download the latest version for your operating system from the **[Releases Page](https://github.com/Omux25/gemini-desktop-app/releases)**.

- **Windows:** Download `Gemini-Desktop-Setup-x.x.x.exe`
- **macOS:** Download `Gemini-Desktop-x.x.x-arm64.dmg`
- **Linux:** Download `Gemini-Desktop-x.x.x.AppImage`

## 🛠️ Building from Source

This project uses an automated GitHub Actions pipeline to compile releases, but you can also build it locally:

1. Ensure you have [Node.js 24+](https://nodejs.org/) installed.
2. Clone this repository:
   ```bash
   git clone https://github.com/Omux25/gemini-desktop-app.git
   cd gemini-desktop-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the application:
   ```bash
   npm run dist
   ```

## 📜 License

This project is licensed under the **MIT** License.
You are completely free to use, modify, distribute, and build upon this code without restriction.
