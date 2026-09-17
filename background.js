const logo = "*://playvortex.io/*logo.png*";
let config;
let saved_avatars;

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
}

async function loadSavedAvatars() {
  const storage = await browser.storage.local.get("savedAvatars")
  const userOverrides = storage.savedAvatars || {};

  const defaults = {
    "Voxel Hair": { shirt_id: 7, pant_id: null, body_type: "male", body_colors: ["#dc8add", "#7a6bd5", "#8f61e3", "#8f61e3", "#510cf4", "#510cf4"], face_id: 52, accessory_ids: [] }
  }

  saved_avatars = { ...defaults, ...userOverrides };
}
//"Voxel Hair": { shirt_id: 7, pant_id: null, body_type: "male", body_colors: ["#dc8add", "#7a6bd5", "#8f61e3", "#8f61e3", "#510cf4", "#510cf4"], face_id: 52, accessory_ids: [] }

async function checkVersionForUpdate() {

  console.log("checking version")

  let currentversiontext;
  let latestversiontext;

  await fetch("/currentversion.txt")
    .then(response => response.text())
    .then(text => {
      currentversiontext = text
    })
    .catch(error => console.error("error reading local version file:", error));

  await fetch("https://codedlunar.github.io/VoPro/latest.txt")
    .then(response => response.text())
    .then(text => {
      latestversiontext = text
    })
    .catch(error => console.error("couldnt read file (latestversion): ", error))

  console.log("cv: " + currentversiontext, "lv: " + latestversiontext)

  if (currentversiontext != latestversiontext) {
    // new version!1!1!1!!!
    console.log("new version")
    browser.tabs.create({
      url: browser.runtime.getURL("update/index.html")
    });

  } else {
    console.log("latest version")
  }
}
loadLocalConfig()

loadSavedAvatars()

browser.runtime.onStartup.addListener(() => {
  checkVersionForUpdate()
})


checkVersionForUpdate()
