function getDomainFromUrl(url) {
  if (!url.startsWith("http")) {
    return null;
  }
  const hostname = new URL(url).hostname;
  // Return the full hostname to include subdomains
  return hostname;
}

const colors = [
  "grey",
  "blue",
  "red",
  "yellow",
  "green",
  "pink",
  "purple",
  "cyan",
  "orange",
];

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

chrome.tabs.onCreated.addListener(function (tab) {
  const domain = getDomainFromUrl(tab.url);
  if (!domain) {
    console.log("Not a valid URL");
    return;
  }

  chrome.tabGroups.query({}, function (groups) {
    let foundGroup = groups.find((group) => group.title === domain);

    if (foundGroup) {
      chrome.tabs.group({ groupId: foundGroup.id, tabIds: tab.id });
    } else {
      chrome.tabs.group(
        { createProperties: { windowId: tab.windowId }, tabIds: tab.id },
        function (groupId) {
          chrome.tabGroups.update(groupId, { title: domain, color: "blue" });
        }
      );
    }
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    const newDomain = getDomainFromUrl(changeInfo.url);

    chrome.tabGroups.query({}, function (groups) {
      let existingGroup = groups.find((group) => group.title === newDomain);

      if (existingGroup) {
        // Move tab to the existing group if it changed domains
        chrome.tabs.group({ groupId: existingGroup.id, tabIds: tabId });
      } else {
        chrome.tabs.group(
          { createProperties: { windowId: tab.windowId }, tabIds: tabId },
          function (groupId) {
            chrome.tabGroups.update(groupId, {
              title: newDomain,
              color: getRandomColor(),
            });
          }
        );
      }
    });
  }
});
