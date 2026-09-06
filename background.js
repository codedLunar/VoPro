const logo = "*://playvortex.io/*logo.png*";
const file = browser.runtime.getURL("images/vortexpluslogo.png");
let config;

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.tabs.create({
      url: browser.runtime.getURL("welcome/index.html")
    });
  }
});


/*async function redirect(details) {
  console.log("pu:",config.profile_username)
  if (config.profile_username == true) {
    console.log("Successfully intercepted logo request:", details.url);
    return { redirectUrl: file };
  }
}*

browser.webRequest.onBeforeRequest.addListener(
  redirect,
  { urls: [logo] },
  ["blocking"]
);*/

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "download") {
    return browser.downloads.download({
      url: message.url,
      saveAs: true
    })
  }
})

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "redirect" && sender.tab) {
    browser.tabs.update(sender.tab.id, {
      url: message.url
    });
  }
});



async function loadLocalConfig() {
  const storage = await browser.storage.local.get("userConfig");
  const userOverrides = storage.userConfig || {};

  const defaults = {
    "profile_username": true,
    "vortex_plus_logo": true,
    "theme": "1",
    "mastertoggle": true,
    "streamer_mode": false,
  };

  config = { ...defaults, ...userOverrides };

  console.log("config:", config)
  console.log("profile username:", config.profileusername)

  //css

  /*browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url && tab.url.includes("playvortex.io")) {
      if (config.mastertoggle == true) {
        try {
          await browser.scripting.unregisterContentScripts({ ids: ["css"] });
        } catch (e) { }

        await browser.scripting.insertCSS({
                  target: { tabId: tabId },
                  files: ["styles.css"],
                  origin: "user"
                });
      } else {
        try { await browser.scripting.unregisterContentScripts({ ids: ["css"] }); } catch (e) { }
      }

    }
    })*/
}

loadLocalConfig()
