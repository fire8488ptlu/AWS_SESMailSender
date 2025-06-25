const form = document.getElementById("emailForm");
const subjectTitle = document.getElementById("subjectTitle");
const textOption = document.getElementById("textOption");
const htmlOption = document.getElementById("htmlOption");
const textMessageDiv = document.getElementById("textMessageDiv");
const htmlFileDiv = document.getElementById("htmlFileDiv");
const recipientTextOption = document.getElementById("recipientTextOption");
const recipientCsvOption = document.getElementById("recipientCsvOption");
const recipientTextDiv = document.getElementById("recipientTextDiv");
const recipientCsvDiv = document.getElementById("recipientCsvDiv");
const recipientEmails = document.getElementById("recipientEmails");
const recipientCsvFile = document.getElementById("recipientCsvFile");
const resultDiv = document.getElementById("result");
const sendEmailsBtn = document.getElementById("sendEmailsBtn");
const loadingSpinner = document.getElementById("loadingSpinner");

// Toggle between Text and HTML File input for content
textOption.addEventListener("change", () => {
  textMessageDiv.style.display = "block";
  htmlFileDiv.style.display = "none";
});

htmlOption.addEventListener("change", () => {
  textMessageDiv.style.display = "none";
  htmlFileDiv.style.display = "block";
});

// Toggle between Text and CSV File input for recipients
recipientTextOption.addEventListener("change", () => {
  recipientTextDiv.style.display = "block";
  recipientCsvDiv.style.display = "none";
});

recipientCsvOption.addEventListener("change", () => {
  recipientTextDiv.style.display = "none";
  recipientCsvDiv.style.display = "block";
});

// Handle form submission
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Hide Send Emails button and show spinner
  sendEmailsBtn.style.display = "none";
  loadingSpinner.style.display = "inline-block";

  try {
    // Collect recipients
    let recipients = [];
    if (recipientTextOption.checked) {
      const emails = recipientEmails.value
        .split(",")
        .map((email) => email.trim());
      recipients = emails.filter((email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ); // Validate emails
    } else if (recipientCsvOption.checked) {
      const csvFile = recipientCsvFile.files[0];
      if (!csvFile) {
        alert("Please upload a CSV file for recipients.");
        throw new Error("CSV file not uploaded.");
      }
      recipients = await window.electronAPI.readCsv(csvFile.path);
    }

    if (recipients.length === 0) {
      alert("No valid recipients found.");
      throw new Error("No valid recipients.");
    }

    // Collect content
    const isText = textOption.checked;
    const message = isText
      ? textMessage.value
      : await window.electronAPI.readFile(htmlContentFile.files[0].path);

    if (!message.trim()) {
      alert("Please provide a message.");
      throw new Error("Message content is empty.");
    }

    // Send emails through main process
    const summary = await window.electronAPI.sendEmails({
      subjectTitle: subjectTitle.value,
      recipients,
      content: message,
      isHtml: !isText,
    });

    resultDiv.innerHTML = `<p>${summary.message}</p>`;
  } catch (error) {
    console.error("Error sending emails:", error);
    resultDiv.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
  } finally {
    // Show Send Emails button and hide spinner
    sendEmailsBtn.style.display = "inline-block";
    loadingSpinner.style.display = "none";
  }
});
