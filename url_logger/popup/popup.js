
// -------------------------------------------------
// processing urls 
// -------------------------------------------------

async function saveTabUrlsToFile() {

  console.log("URL Logger Button was clicked")

  // get tabs from active window 
  const tabs = await chrome.tabs.query({
    currentWindow: true
  });

  const urls = tabs.map(tab => tab.url);
  urls.sort()

  // Create a text file content with URLs separated by newline
  const fileContent = urls.join('\n');

  // Create a Blob containing the file content
  const blob = new Blob([fileContent], { type: 'text/plain' });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element
  const tempAnchor = document.createElement('a');
  tempAnchor.href = url;
  tempAnchor.download = 'tab_urls.txt';

  // Programmatically click the anchor to trigger the download
  tempAnchor.click();

  // Clean up by revoking the URL object
  URL.revokeObjectURL(url);
}

const button1 = document.getElementById('log_button');
button1.addEventListener("click", saveTabUrlsToFile);

// -------------------------------------------------
// displaying tabs 
// -------------------------------------------------

// // get tabs from active window 
// const tabs = await chrome.tabs.query({
//   currentWindow: true
// });

// const collator = new Intl.Collator();
// tabs.sort((a, b) => collator.compare(a.title, b.title));

// const template = document.getElementById("li_template");
// const elements = new Set();
// for (const tab of tabs) {
//   const element = template.content.firstElementChild.cloneNode(true);

//   const title = tab.title.split("-")[0].trim();
//   const pathname = new URL(tab.url).pathname.slice("/docs".length);

//   element.querySelector(".title").textContent = title;
//   element.querySelector(".pathname").textContent = pathname;
//   element.querySelector("a").addEventListener("click", async () => {
//     // need to focus window as well as the active tab
//     await chrome.tabs.update(tab.id, { active: true });
//     await chrome.windows.update(tab.windowId, { focused: true });
//   });

//   elements.add(element);
// }
// document.querySelector("ul").append(...elements);

// -------------------------------------------------
// grouping tabs + group button 
// -------------------------------------------------

async function updateTabGroupTitle() {
  console.log("Group Button was clicked -> updateTabGroupTitle")
  const tabIds = tabs.map(({ id }) => id);
  const group = await chrome.tabs.group({ tabIds });
  await chrome.tabGroups.update(group, { title: "DOCS" });
}

async function groupTabsByDomain() {
  
  console.log("Group Button was clicked -> groupTabsByDomain")

  // get tabs from active window 
  const tabs = await chrome.tabs.query({
    currentWindow: true
  });
  
  // Create an object to store tabs grouped by domain
  const tabsByDomain = {};

  // Group the tabs by domain
  tabs.forEach(tab => {
    if (!tab.pinned) {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!tabsByDomain[domain]) {
        tabsByDomain[domain] = [];
      }
      tabsByDomain[domain].push(tab.id);
    }
  });

  // Create an array to store tab group objects
  const tabGroups = [];

  // Create a tab group for each domain and update their titles
  for (const domain in tabsByDomain) {
    const tabIds = tabsByDomain[domain];
    const group = await chrome.tabs.group({ tabIds });
    const title = `${domain}`; // You can customize the title as needed
    tabGroups.push({ group, title });
  }

  // Update tab group titles
  for (const { group, title } of tabGroups) {
    await chrome.tabGroups.update(group, { title });
  }
}

const button2 = document.getElementById('group_button');
button2.addEventListener("click", groupTabsByDomain);

// -------------------------------------------------
// ungroup tabs 
// -------------------------------------------------

async function ungroupAllTabs() {

  console.log("Ungroup Button was clicked")

  // get tabs from active window 
  const tabs = await chrome.tabs.query({
    currentWindow: true
  });

  // Ungroup each tab group
  for (const tab of tabs) {
    if (tab.groupId !== -1) {
      await chrome.tabs.ungroup(tab.id);
    }
  }

}

const button3 = document.getElementById('ungroup_button');
button3.addEventListener('click', ungroupAllTabs);

// -------------------------------------------------
// open tabs 
// -------------------------------------------------

function openUrlsFromFile() {
  const file = this.files[0];

  if (!file) {
    console.error('No file selected.');
    return;
  }

  const fileReader = new FileReader();

  fileReader.onload = function (event) {
    const fileContent = event.target.result;
    const urls = fileContent.split('\n');

    for (const url of urls) {
      if (url.trim() !== '') {
        chrome.tabs.create({ url });
      }
    }
  };

  fileReader.readAsText(file);
}

function get_file() {
  document.getElementById('fileInput').click();
}


// Get reference to the button in the HTML
const button4 = document.getElementById('openUrlsButton');
const fileInput = document.getElementById('fileInput');

// Attach event listener to the button
button4.addEventListener('click', get_file);
fileInput.addEventListener('change', openUrlsFromFile);

// -------------------------------------------------
