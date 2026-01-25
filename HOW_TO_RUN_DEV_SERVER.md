# How to Run the Development Server

## Quick Start Guide

### Step 1: Open Terminal in Cursor
- Press `` Ctrl + ` `` (backtick key, usually above Tab)
- OR go to menu: `Terminal` → `New Terminal`
- A terminal panel will appear at the bottom of Cursor

### Step 2: Navigate to Project (if needed)
The terminal should already be in your project directory, but if not:
```bash
cd /Users/justin/teenvest-1
```

### Step 3: Start the Dev Server
Type this command and press Enter:
```bash
npm run dev
```

### Step 4: Wait for Server to Start
You'll see output like this:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

### Step 5: Open in Browser
- **Option 1:** Click the `http://localhost:8080` link in the terminal
- **Option 2:** Copy the URL and paste it into your browser
- **Option 3:** Manually type `http://localhost:8080` in your browser

## What Happens Next?

✅ **Hot Reload:** When you save any file, the browser automatically refreshes  
✅ **See Changes Instantly:** Your edits appear immediately  
✅ **Error Messages:** Any errors show in both the terminal and browser console

## Stopping the Server

To stop the dev server:
- Press `Ctrl + C` in the terminal
- Type `q` and press Enter (if prompted)

## Troubleshooting

### "npm: command not found"
- Make sure Node.js is installed
- Check with: `node --version` and `npm --version`

### "Port 8080 already in use"
- Another process is using port 8080
- Stop that process or change the port in `vite.config.ts`

### "Cannot find module"
- Run: `npm install` to install dependencies

### Server won't start
- Check for errors in the terminal output
- Make sure you're in the project directory
- Try deleting `node_modules` and running `npm install` again

## Tips

💡 **Keep Terminal Open:** Leave the terminal running while developing  
💡 **Check Terminal for Errors:** Red text usually means something needs fixing  
💡 **Browser DevTools:** Press `F12` to see console errors  
💡 **Multiple Tabs:** You can open multiple browser tabs with the same URL

## What You'll See

When the server is running:
- ✅ Terminal shows "ready" message
- ✅ Browser shows your landing page
- ✅ Changes appear automatically when you save files
- ✅ No need to manually refresh!

---

**That's it!** Your development server is now running and ready for development. 🚀
