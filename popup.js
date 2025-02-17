document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api_key");
  const saveKeyButton = document.getElementById("save_key");

  // Load API key from storage on popup open
  chrome.storage.sync.get("openai_api_key", (data) => {
    if (data.openai_api_key) {
      apiKeyInput.value = data.openai_api_key;
    }
  });

  saveKeyButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value;
    chrome.storage.sync.set({ openai_api_key: apiKey }, () => {
      console.log("API key saved");
      alert("API key saved!");
    });
  });
});
