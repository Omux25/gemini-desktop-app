# Gemini Desktop App

A native, highly optimized Windows desktop application wrapper for Google Gemini, built using Electron.

## Features
- **Always on Top:** Easily reference Gemini while gaming or working.
- **Global Hotkey (`Alt+Space`):** Instantly summon or hide the chat window from anywhere in Windows.
- **System Tray Integration:** Runs quietly in the background without cluttering your taskbar.
- **Memory Optimized:** Automatically throttles resources and garbage collects when hidden to save RAM.
- **Hardware Acceleration Disabled:** Prevents the app from stealing your GPU while playing games.

## Installation

### Method 1: Portable (No Install Required)
Simply download the `Gemini Desktop Portable.exe` file from the Releases page and run it anywhere.

### Method 2: Standard Installer
Download and run the `Gemini Desktop Setup.exe` file to install it properly onto your system.

## Building from Source

To compile the executables yourself:

1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/geminidesktopapp.git
   cd geminidesktopapp
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
MIT
