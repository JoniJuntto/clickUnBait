document.addEventListener("DOMContentLoaded", async () => {
  let groups = await chrome.tabGroups.query({});
  let container = document.getElementById("groups");
  groups.forEach((group) => {
    let groupDiv = document.createElement("div");
    groupDiv.textContent = group.title;
    groupDiv.style.cursor = "pointer";
    groupDiv.onclick = () => toggleTabsInGroup(group.id, groupDiv);
    container.appendChild(groupDiv);
  });
});

async function toggleTabsInGroup(groupId, groupDiv) {
  if (
    !groupDiv.nextElementSibling ||
    groupDiv.nextElementSibling.tagName !== "UL"
  ) {
    let tabs = await chrome.tabs.query({ groupId: groupId });
    let ul = document.createElement("ul");
    tabs.forEach((tab) => {
      let li = document.createElement("li");
      li.textContent = tab.title;
      ul.appendChild(li);
    });
    if (groupDiv.nextElementSibling) {
      groupDiv.parentNode.insertBefore(ul, groupDiv.nextElementSibling);
    } else {
      groupDiv.parentNode.appendChild(ul);
    }
  } else {
    groupDiv.nextElementSibling.remove();
  }
}
