const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const AWS = require("aws-sdk");
//require("dotenv").config(); // Load environment variables from a .env file
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Load AWS configuration from environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const ses = new AWS.SES();

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    width: 800,
    height: 600,
  });
  mainWindow.loadFile("index.html");
});

ipcMain.handle("send-emails", async (event, data) => {
  const { recipients, subjectTitle, content, isHtml } = data;
  console.log("Processing email sending...");

  const summary = await sendBulkEmails(
    recipients,
    subjectTitle,
    content,
    isHtml
  );
  //console.log(summary.message);
  return summary; // Send the summary back to the renderer process
});

ipcMain.handle("read-file", async (event, filePath) => {
  return fs.readFileSync(filePath, "utf8");
});

ipcMain.handle("read-csv", async (event, filePath) => {
  const csv = require("fast-csv");
  const recipients = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("data", (row) => {
        if (row.email) recipients.push(row.email);
      })
      .on("end", () => resolve(recipients))
      .on("error", (error) => reject(error));
  });
});

async function sendBulkEmails(recipients, subjectTitle, content, isHtml) {
  const verifiedEmail = process.env.VERIFIED_EMAIL;
  let totalSent = 0;
  let totalFailed = 0;

  for (const email of recipients) {
    const params = {
      Destination: { ToAddresses: [email] },
      Message: {
        Body: isHtml
          ? { Html: { Charset: "UTF-8", Data: content } }
          : { Text: { Charset: "UTF-8", Data: content } },
        Subject: { Charset: "UTF-8", Data: subjectTitle },
      },
      Source: verifiedEmail,
    };

    try {
      await ses.sendEmail(params).promise();
      totalSent++;
    } catch (error) {
      totalFailed++;
      console.error(`Failed to send to ${email}: ${error.message}`);
    }
  }

  // Return a summary instead of detailed records
  return {
    totalSent,
    totalFailed,
    message: `Emails processed. Sent: ${totalSent}, Failed: ${totalFailed}`,
  };
}
