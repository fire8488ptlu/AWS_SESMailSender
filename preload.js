const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  sendEmails: (data) => {
    try {
      return ipcRenderer.invoke("send-emails", data);
    } catch (error) {
      console.error("Error invoking sendEmails:", error);
    }
  },
  readFile: (filePath) => {
    try {
      return ipcRenderer.invoke("read-file", filePath);
    } catch (error) {
      console.error("Error invoking readFile:", error);
    }
  },
  readCsv: (filePath) => {
    try {
      return ipcRenderer.invoke("read-csv", filePath);
    } catch (error) {
      console.error("Error invoking readCsv:", error);
    }
  },
});
