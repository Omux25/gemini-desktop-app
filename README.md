# Gemini Desktop App

![Gemini Desktop Banner](./splash.png)

A premium, highly optimized Windows desktop application wrapper for Google Gemini, built using Electron. This application brings Gemini out of your browser tabs and turns it into a native, powerful desktop assistant.

## Features

- **Global Hotkey (`Alt+Space`):** Instantly summon or hide the chat window from anywhere in Windows, without interrupting your workflow.
- **Always on Top:** Pin the window so you can easily reference Gemini while gaming, coding, or working.
- **Custom Window Sizes:** Switch between Compact, Standard, Tall, and Large presets to perfectly fit your screen.
- **System Tray Integration:** Runs quietly in the background without cluttering your taskbar.
- **Launch on Startup:** Automatically boots silently in the background when you log into Windows, ensuring your hotkey is always ready.
- **Hardware Acceleration Toggle:** Choose between Buttery Smooth GPU rendering or Extreme Battery/RAM Saver mode.
- **Memory Optimized:** Automatically throttles resources and forces garbage collection when hidden to save RAM.
- **Secure External Links:** Clicking external links (like Wikipedia) safely opens your default web browser instead of hijacking the app.

## Installation

### Method 1: Portable (No Install Required)
Simply download the `Gemini Desktop Portable.exe` file from the [Releases](#) page and run it anywhere.

### Method 2: Standard Installer
Download and run the `Gemini Desktop Setup.exe` file to install it properly onto your system.

## Building from Source

To compile the executables yourself:

1. Ensure you have [Node.js](https://nodejs.org/) installed.
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

This will output both the Portable `.exe` and the Setup `.exe` into the `dist/` folder.

## License

This project is licensed under the **CC BY-NC 4.0** (Creative Commons Attribution-NonCommercial 4.0 International) License. 
You are free to share and adapt the material for non-commercial purposes, but you may **not** use the material for commercial purposes.
