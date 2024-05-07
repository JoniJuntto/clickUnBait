document.addEventListener("DOMContentLoaded", async () => {
  let groups = await chrome.tabGroups.query({});
  let container = document.getElementById("groups");
  groups.forEach((group) => {
    let groupDiv = document.createElement("div");
    groupDiv.textContent = group.title ? group.title : "Ungrouped";
    groupDiv.style.cursor = "pointer";
    groupDiv.onclick = () => toggleTabsInGroup(group.id, groupDiv);
    container.appendChild(groupDiv);
  });
});

async function toggleTabsInGroup(groupId, groupDiv) {
  const group = await chrome.tabGroups.get(groupId);
  chrome.tabGroups.update(groupId, { collapsed: !group.collapsed });

  let ul = groupDiv.nextElementSibling;
  if (!ul || ul.tagName !== "UL") {
    let tabs = await chrome.tabs.query({ groupId: groupId });
    ul = document.createElement("ul");
    tabs.forEach((tab) => {
      let li = document.createElement("li");
      li.textContent = tab.title;

      li.addEventListener("click", () => {
        console.log("Clicked tab ID:", tab.id);

        chrome.tabs.update(tab.id, { active: true }, (updatedTab) => {
          if (updatedTab) {
            console.log("Tab successfully activated:", updatedTab.id);
          } else {
            console.error("Error activating tab:", chrome.runtime.lastError);
          }
        });
      });

      ul.appendChild(li);
    });
    if (groupDiv.nextElementSibling) {
      groupDiv.parentNode.insertBefore(ul, groupDiv.nextElementSibling);
    } else {
      groupDiv.parentNode.appendChild(ul);
    }
  } else {
    ul.remove();
  }

  groupDiv.classList.toggle("collapsed", group.collapsed);
}
