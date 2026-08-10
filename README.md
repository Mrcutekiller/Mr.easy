# MR.easy — The Simple Web Programming Language 🚀

> **Every file starts with `Mr.easy` — unforgettable, powerful, and beautiful.**

---

## What is MR.easy?

MR.easy is a programming language for building websites. It's so simple that **anyone can learn it in one day**. You just write words, and it builds your website.

```
Mr.easy "My Website"

nav
  logo "MySite"
  links Home About Contact

hero
  title "Hello World" big glow
  subtitle "Built with MR.easy in under 5 minutes"
  button "Get Started" blue big

section "features"
  grid cols:3
    card shadow
      icon rocket
      title "Fast" small
      text "Build in minutes"
    card shadow
      icon heart
      title "Simple" small  
      text "Anyone can learn"
    card shadow
      icon bolt
      title "Beautiful" small
      text "Stunning by default"

footer
  text "Made with ❤️ using Mr.easy"
```

**That's it. That produces a beautiful, dark-mode website.**

---

## Installation

### Option 1 — Quick Install (Recommended)
```powershell
# Run as Administrator in PowerShell:
powershell -ExecutionPolicy Bypass -File installer\install.ps1
```

### Option 2 — Batch Installer
Double-click `installer\install.bat` (run as Administrator)

### Option 3 — Manual
```bash
npm install
npm link
```

---

## 🔰 Beginner's Guide — How to Use MR.easy

### 💻 Working on your PC (Terminal & VS Code)

#### **1️⃣ Installation**
Run `installer\install.bat` inside the project folder, or run in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File installer\install.ps1
```

---

#### **📁 Workflow A: Start a New Project Automatically (`mreasy new`)**
Use this when starting from scratch. MR.easy will create the project folder for you:
```powershell
# 1. Create project (this automatically creates a new folder named 'mywebsite'):
mreasy new mywebsite

# 2. Enter the created folder:
cd mywebsite

# 3. Start live preview server (opens browser at http://localhost:3000):
mreasy run
```

---

#### **✏️ Workflow B: Using Your Own Existing Folder or Manual File**
If you already created your own folder manually or wrote your own `index.mreasy` (or `mysite.mreasy`):
```powershell
# 1. Open your terminal inside your existing folder:
cd path\to\your\folder

# 2. Start live preview (mreasy automatically detects your file without overwriting it):
mreasy run
```
> 💡 **Note**: You do NOT need `mreasy new` if you already created your folder or `.mreasy` file manually! `mreasy run` will automatically detect and serve your existing code.

---

#### **⚡ Workflow C: Compile a Single Standalone File**
If you just want to compile a single `.mreasy` file into a standalone `.html` file:
```powershell
mreasy compile myfile.mreasy
```
*This produces `myfile.html` right next to your file.*

---

#### **🏗️ Building Production Output**
When you finish your website and want to publish or share it:
```powershell
mreasy build
```
*Generates a clean HTML bundle inside `dist/index.html`.*

---

### 🌐 Working in the Web IDE (No Install Needed)

1. Open `ide/index.html` in your browser (or visit [mr-easy.vercel.app/ide](https://mr-easy.vercel.app/ide)).
2. Write or edit MR.easy code in the **left panel**.
3. See your live website update instantly in the **right panel**.
4. Click **Download ZIP** at the top right to download your finished website code.

---

## Language Reference

### 📌 The Declaration (Required)
Every `.mreasy` file **MUST** start with this:
```
Mr.easy "Your Page Title"
```
This is the signature of the language — like `<!DOCTYPE html>` in HTML.

---

### 📐 Layout Elements

| Element | Example | What it does |
|---------|---------|--------------|
| `nav` | `nav` | Navigation bar |
| `hero` | `hero` | Big hero section |
| `section "name"` | `section "about"` | Page section |
| `grid cols:3` | `grid cols:3` | 3-column grid |
| `row` | `row center` | Horizontal row |
| `column` | `column` | Vertical column |
| `card` | `card shadow` | Content card |
| `footer` | `footer` | Page footer |

### 📝 Content Elements

| Element | Example | What it does |
|---------|---------|--------------|
| `title` | `title "Hello" big glow` | Heading |
| `subtitle` | `subtitle "Text here"` | Subtitle |
| `text` | `text "Paragraph"` | Paragraph |
| `button` | `button "Click" blue big` | Button |
| `link` | `link "Google" url:google.com` | Link |
| `image` | `image "photo.jpg" rounded` | Image |
| `icon` | `icon star` | Icon |
| `input` | `input type:email` | Form input |
| `divider` | `divider` | Horizontal line |
| `spacer` | `spacer size:40` | Empty space |

### 🎨 Style Modifiers

Add these words after any element:

| Modifier | Effect |
|----------|--------|
| `big` / `medium` / `small` / `tiny` | Size |
| `glow` | Glowing gradient text effect |
| `shadow` | Drop shadow |
| `rounded` | Rounded corners |
| `glass` | Frosted glass effect |
| `outline` | Outline style (for buttons) |
| `center` | Center alignment |
| `blue` / `red` / `green` / `purple` / `orange` / `pink` | Color |
| `gradient` | Animated gradient text |
| `float` | Floating animation |

### 🔧 Nav Helpers

```
nav
  logo "BrandName"
  links Home About Services Contact
```

### 🔁 Logic

```
set name = "Biruk"
text "Hello, {name}!"

repeat 3 times
  card shadow
    text "Item number {index}"
```

---

## CLI Commands

```bash
mreasy new <name>      # Create new project
mreasy run             # Start live preview server
mreasy build           # Build to dist/index.html
mreasy compile <file>  # Compile single file
mreasy help            # Show help
```

---

## Web IDE

Open `ide/` in your browser for the full AI-style web IDE with:
- ✨ Syntax highlighting
- 🔴 Live preview (split pane)
- 📋 Snippet library
- 💾 Download & copy HTML
- 📱 Mobile/tablet/desktop viewport preview
- 📖 Built-in language guide

---

## Project Structure

```
myproject/
├── index.mreasy     ← Your main file
├── images/          ← Put your images here
└── dist/            ← Compiled output (after mreasy build)
```

---

## VS Code Extension & Editor Support

MR.easy comes with full VS Code syntax highlighting, indentation, and snippets!

### Install in VS Code:
```powershell
powershell -ExecutionPolicy Bypass -File installer\install-vscode-extension.ps1
```
Or open VS Code, copy `vscode-extension/` to `%USERPROFILE%\.vscode\extensions\mreasy-vscode-1.0.0`, and restart VS Code.

---

## License

MIT — Free to use, modify, and share.

**Created by Biruk** (IG: [@mrcute_killer](https://instagram.com/mrcute_killer)) — Ethiopia 🇪🇹
