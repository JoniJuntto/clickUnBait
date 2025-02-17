let mainTabId = null;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    (tab.url.startsWith("https://www.is.fi/") ||
      tab.url.startsWith("https://www.iltasanomat.fi/"))
  ) {
    // Store main tab ID if we're on the main page
    if (!tab.url.includes("/art-")) {
      mainTabId = tabId;

      // Find links on main page
      chrome.scripting.executeScript(
        {
          target: { tabId },
          function: findLinks,
        },
        (results) => {
          if (results && results[0] && results[0].result) {
            const links = results[0].result;

            // Process each link
            links.forEach((link) => {
              // Immediately update the title to "Tehdään otsikosta luettavampi..."
              chrome.scripting.executeScript(
                {
                  target: { tabId: mainTabId },
                  function: updateLinkTitleTemporary,
                  args: [link, "Tehdään otsikosta luettavampi..."],
                },
                () => {
                  chrome.tabs.create(
                    { url: link, active: false },
                    (newTab) => {
                      // Once new tab is created, set up listener for its completion
                      chrome.tabs.onUpdated.addListener(function listener(
                        updatedTabId,
                        changeInfo
                      ) {
                        if (
                          updatedTabId === newTab.id &&
                          changeInfo.status === "complete"
                        ) {
                          chrome.tabs.onUpdated.removeListener(listener);

                          // Get both title and paragraphs from the article
                          chrome.scripting.executeScript(
                            {
                              target: { tabId: newTab.id },
                              function: getArticleContent,
                            },
                            async (contentResults) => {
                              if (
                                contentResults &&
                                contentResults[0] &&
                                contentResults[0].result
                              ) {
                                try {
                                  const newTitle = await getNewTitle(
                                    contentResults[0].result
                                  );

                                  if (newTitle) {
                                    // Update the title in the main tab with the new title
                                    chrome.scripting.executeScript({
                                      target: { tabId: mainTabId },
                                      function: updateLinkTitle,
                                      args: [link, newTitle],
                                    });
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error processing article:",
                                    error
                                  );
                                }

                                // Close the article tab
                                chrome.tabs.remove(newTab.id);
                              }
                            }
                          );
                        }
                      });
                    }
                  );
                }
              );
            });
          }
        }
      );
    }
  }
});

function findLinks() {
  const linkElements = Array.from(
    document.querySelectorAll('a.block[href*="art-"]')
  );

  const links = linkElements.map((a) => {
    return new URL(a.getAttribute("href"), window.location.origin).href;
  });

  console.log("Found links:", links);
  return links;
}

function getArticleContent() {
  const titleElement = document.querySelector("h2.teaser-m__title");

  let title = "";
  if (titleElement) {
    title = titleElement.textContent.trim();
  }

  const paragraphs = Array.from(
    document.querySelectorAll("section.article-body p.article-body")
  )
    .slice(0, 7)
    .map((p) => p.textContent.trim());

  return {
    title: title, // Extract text content for OpenAI
    paragraphs,
  };
}

async function getNewTitle(data) {
  console.log(`Title: "${data.title}"\nParagraphs:`, data.paragraphs);

  const prompt = `Original title: ${data.title}\nArticle content: ${data.paragraphs.join(
    "\n"
  )}\n \n Rewrite the title to be less clickbaity and more informative based on the article content, but keep the original meaning. ALWAYS answer in Finnish. Return only the new title:`;
  console.log(prompt);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer `,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that rewrites titles to be less clickbaity and more informative.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 60,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("OpenAI Response:", data);
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      console.warn("No choices returned from OpenAI.");
      return null;
    }
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error; // Re-throw to be caught in the outer function
  }
}

function updateLinkTitle(link, betterTitle) {
  const linkElements = Array.from(
    document.querySelectorAll('a.block[href*="art-"]')
  );

  linkElements.forEach((a) => {
    if (new URL(a.getAttribute("href"), window.location.origin).href === link) {
      // Find the h2.teaser-m__title element within the link
      const titleElement = a.querySelector("h2.teaser-m__title");

      if (titleElement) {
        const originalTitle = titleElement.innerText;
        titleElement.innerText = betterTitle;
        console.log(
          `Updated title ${originalTitle} for link ${link} to: ${betterTitle}`
        );
      }
    }
  });
}

function updateLinkTitleTemporary(link, temporaryTitle) {
  const linkElements = Array.from(
    document.querySelectorAll('a.block[href*="art-"]')
  );

  linkElements.forEach((a) => {
    if (new URL(a.getAttribute("href"), window.location.origin).href === link) {
      // Find the h2.teaser-m__title element within the link
      const titleElement = a.querySelector("h2.teaser-m__title");

      if (titleElement) {
        titleElement.innerText = temporaryTitle;
        console.log(
          `Updated title ${titleElement.innerText} for link ${link} to temporary title: ${temporaryTitle}`
        );
      }
    }
  });
}
