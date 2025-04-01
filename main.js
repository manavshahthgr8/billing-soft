const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let serverProcess;

app.on('ready', () => {
    // Start the Node.js server
    serverProcess = exec('node server.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting server: ${error}`);
            return;
        }
        console.log(stdout);
    });

    // Create Electron window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Keep this true if you need access to Node.js modules
            contextIsolation: false, // Allows direct DOM manipulation in preload scripts
        }
    });

    // Load the web app
    mainWindow.loadURL('http://localhost:3000');

    // Fix modal input issue: Force repaint on focus
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
            document.addEventListener("click", function () {
                setTimeout(() => {
                    document.body.offsetHeight; // Forces repaint
                }, 50);
            });
        `);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (serverProcess) serverProcess.kill();
    });
});

app.on('window-all-closed', () => {
    if (serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
