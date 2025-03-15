// Check Scanner Implementation

// Import Firebase modules (if using modules)
// import firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/database';

// Or, if using CDN, ensure Firebase is initialized before this script runs

// Declare firebase variable
// let firebase // REMOVED

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const checkScannerBtn = document.getElementById("checkScannerBtn")
  const checkScannerModal = document.getElementById("checkScannerModal")
  const closeScanner = document.querySelector(".close-scanner")
  const cameraFeed = document.getElementById("cameraFeed")
  const capturedImage = document.getElementById("capturedImage")
  const captureBtn = document.getElementById("captureBtn")
  const retakeBtn = document.getElementById("retakeBtn")
  const processBtn = document.getElementById("processBtn")
  const scannerButtons = document.querySelector(".scanner-buttons")
  const processingIndicator = document.querySelector(".processing-indicator")

  // Stream variables
  let stream = null
  let capturedImageBlob = null

  // Groq Vision API Key
  const GROQ_VISION_API_KEY = "REDACTED_GROQ_API_KEY"

  // Declare refreshTransactions (assuming it's defined elsewhere)
  let refreshTransactions // You might need to assign a function to this

  // Open scanner modal
  if (checkScannerBtn) {
    checkScannerBtn.addEventListener("click", () => {
      if (checkScannerModal) {
        checkScannerModal.style.display = "flex"
        startCamera()
      }
    })
  }

  // Close scanner modal
  if (closeScanner) {
    closeScanner.addEventListener("click", () => {
      checkScannerModal.style.display = "none"
      stopCamera()
      resetUI()
    })
  }

  // Start camera feed
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      cameraFeed.srcObject = stream
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Unable to access your camera. Please ensure you have given permission and have a working camera.")
    }
  }

  // Stop camera feed
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      stream = null
    }
  }

  // Reset UI to initial state
  function resetUI() {
    if (cameraFeed) cameraFeed.style.display = "block"
    if (capturedImage) capturedImage.style.display = "none"
    if (captureBtn) captureBtn.style.display = "block"
    if (scannerButtons) scannerButtons.style.display = "none"
    if (processingIndicator) processingIndicator.style.display = "none"
    capturedImageBlob = null
  }

  // Capture image from camera
  if (captureBtn) {
    captureBtn.addEventListener("click", () => {
      // Create a canvas element to capture the frame
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")

      // Set canvas dimensions to match the video
      canvas.width = cameraFeed.videoWidth
      canvas.height = cameraFeed.videoHeight

      // Draw the current video frame on the canvas
      context.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height)

      // Convert canvas to data URL (image)
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9)

      // Set the captured image and update UI
      capturedImage.src = imageDataUrl
      capturedImage.style.display = "block"
      cameraFeed.style.display = "none"
      captureBtn.style.display = "none"
      scannerButtons.style.display = "flex"

      // Convert data URL to Blob for sending to API
      canvas.toBlob(
        (blob) => {
          capturedImageBlob = blob
        },
        "image/jpeg",
        0.9,
      )
    })
  }

  // Retake photo
  if (retakeBtn) {
    retakeBtn.addEventListener("click", () => {
      if (cameraFeed) cameraFeed.style.display = "block"
      if (capturedImage) capturedImage.style.display = "none"
      if (captureBtn) captureBtn.style.display = "block"
      if (scannerButtons) scannerButtons.style.display = "none"
      capturedImageBlob = null
    })
  }

  // Process the check image
  if (processBtn) {
    processBtn.addEventListener("click", async () => {
      if (!capturedImageBlob) {
        alert("No image captured. Please take a photo of your check first.")
        return
      }

      // Show processing indicator
      if (scannerButtons) scannerButtons.style.display = "none"
      if (processingIndicator) processingIndicator.style.display = "block"

      try {
        // Process the check using the Groq API
        const checkData = await processCheckWithGroq(capturedImageBlob)

        // Add the transaction to Firebase
        await addCheckTransactionToFirebase(checkData)

        // Close the scanner and reset
        if (checkScannerModal) checkScannerModal.style.display = "none"
        stopCamera()
        resetUI()

        // Show success message
        alert(`Check successfully added as income: $${checkData.amount.toFixed(2)} (${checkData.category})`)

        // Refresh transactions list if it exists
        if (typeof window.refreshTransactions === "function") {
          window.refreshTransactions()
        }
      } catch (error) {
        console.error("Error processing check:", error)
        if (processingIndicator) processingIndicator.style.display = "none"
        if (scannerButtons) scannerButtons.style.display = "flex"
      }
    })
  }

  // Helper function to convert Blob to base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1]
        resolve(base64String)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Process the check image with Groq's vision model
  async function processCheckWithGroq(imageBlob) {
    try {
      // Convert the image blob to base64
      const base64Image = await blobToBase64(imageBlob)

      console.log("Sending request to Groq Vision API...")

      // Use the correct Groq API endpoint with the vision API key
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_VISION_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "You are a financial assistant. Extract the amount, date, and category from this check image. Respond with a JSON object with fields: amount (number), date (YYYY-MM-DD), and category (string, default to 'Check Deposit').",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 150,
          top_p: 1,
          stream: false,
        }),
      })

      if (!response.ok) {
        console.error("API response status:", response.status)
        console.error("API response text:", await response.text())
        throw new Error(`Groq API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Vision API response:", data)

      // Parse the JSON response from the LLM
      let checkData
      try {
        // The AI response might need to be parsed from the text content
        const responseText = data.choices[0].message.content
        console.log("Response content:", responseText)

        // Extract JSON if it's within text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          checkData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Could not extract JSON from response")
        }
      } catch (parseError) {
        console.error("Error parsing LLM response:", parseError)
        // Fallback to defaults
        checkData = {
          amount: 100.0,
          category: "Check Deposit",
          date: new Date().toISOString().split("T")[0],
        }
      }

      // Ensure we have all required fields
      return {
        amount: Number.parseFloat(checkData.amount || 100.0),
        category: checkData.category || "Check Deposit",
        date: checkData.date || new Date().toISOString().split("T")[0],
      }
    } catch (error) {
      console.error("Error calling Groq Vision API:", error)
      throw error
    }
  }

  // Add the check transaction to Firebase
  async function addCheckTransactionToFirebase(checkData) {
    try {
      // Get current user from Firebase Auth
      const user = window.firebase.auth().currentUser

      if (!user) {
        throw new Error("User not logged in. Please log in to add transactions.");
      }

      // Create a new transaction object
      const newTransaction = {
        id: Date.now(), // Unique ID
        type: "income",
        amount: checkData.amount,
        category: checkData.category,
        date: checkData.date,
        timestamp: window.firebase.database.ServerValue.TIMESTAMP,
        method: "Check Scan",
      };

      // Add to Firebase database
      const transactionRef = window.firebase.database().ref(`users/${user.uid}/transactions`);
      await transactionRef.push(newTransaction);

      console.log("Check transaction added successfully:", newTransaction);
      return newTransaction;
    } catch (error) {
      console.error("Error adding check transaction to Firebase:", error);
      throw error;
    }
  }
})
