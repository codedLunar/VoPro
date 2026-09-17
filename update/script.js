let zipResponseClone;
let percent = 0;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function updateProgress(progress) {
    const meter = document.querySelector("#meter");
    meter.style.paddingRight = `${(progress * 661) / 100}px`;
}

function getBrowserFamily() {
  const ua = navigator.userAgent;

  if (/Firefox\/|FxiOS\//i.test(ua)) {
    return "Firefox/Firefox based";
  }

  if (/Chrome\/|CriOS\/|Chromium\/|Edg\/|EdgA\/|EdgiOS\/|OPR\/|Brave/i.test(ua)) {
    return "Chrome/Chromium based";
  }

  if (/AppleWebKit\//i.test(ua)) {
    return "Safari/Webkit based";
  }

  return "Unknown";
}

console.log(getBrowserFamily());

document.querySelectorAll(".link").forEach((link) => {
  link.addEventListener("click", async () => {
    await wait(100)
    window.location.reload();
  })
})

document.querySelector("#detect").textContent = `We detected that you are using a ${getBrowserFamily()} browser.`
let browser = getBrowserFamily() === 'Firefox/Firefox based' ? "firefox" : getBrowserFamily() === 'Chrome/Chromium based' ? "chromium" : getBrowserFamily() === "Safari/Webkit based" ? "safari" : "unknown";

console.log("browser" + browser)

let latestversion;

async function getLatestVersion() {

  await fetch("https://codedlunar.github.io/VoPro/latest.txt")
    .then(response => response.text())
    .then(text => {
      latestversion = text
    })
    .catch(error => console.error("couldnt read file (latestversion): ", error))

  document.querySelector("#version").textContent = `Version ${latestversion} is out!`

}

getLatestVersion()

async function verifyZip(browser_download) {

    const interval = setInterval(() => {
        if (percent < 90) {
            percent += 1;
            updateProgress(percent);
        }
    }, 100);

    let zipResponse, sigResponse, pubResponse

    try {
        [zipResponse, sigResponse, pubResponse] = await Promise.all([
          fetch(`https://codedlunar.github.io/VoPro/releases/${latestversion}/VoPro-main-${browser_download}.zip`),
            fetch(`https://codedlunar.github.io/VoPro/releases/${latestversion}/VoPro-main-${browser_download}.zip.sig`),
            fetch("/keys/public.pem")
        ]);
    } catch (netError) {
        clearInterval(interval);
        console.log("no connection" + netError)
        document.querySelector("#title").textContent = "Could not download update files. Check your internet connection.";
        document.querySelector("#title").style.color = "orange";
        return { status: 'HTTP_ERROR' } ;
    }

    zipResponse = await fetch(`https://codedlunar.github.io/VoPro/releases/${latestversion}/VoPro-main-${browser_download}.zip`);
    sigResponse = await fetch(`https://codedlunar.github.io/VoPro/releases/${latestversion}/VoPro-main-${browser_download}.zip.sig`);
    pubResponse = await fetch("/keys/public.pem");

    clearInterval(interval);

    updateProgress(100);

    zipResponseClone = zipResponse.clone()

    const zipBytes = await zipResponse.arrayBuffer();
    const signature = await sigResponse.arrayBuffer();
    const publicPem = await pubResponse.text();


    // get the full public key

    const base64 = publicPem
        .replace("-----BEGIN PUBLIC KEY-----", "")
        .replace("-----END PUBLIC KEY-----", "")
        .replace(/\s/g, "");

    const binary = atob(base64);
    const publicKeyBytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        publicKeyBytes[i] = binary.charCodeAt(i);
    }

    // import the public key

    const publicKey = await crypto.subtle.importKey(
        "spki",
        publicKeyBytes,
        {
            name: "Ed25519"
        },
        false,
        ["verify"]
    );

    // get the hash of the current public key

    const hash = await crypto.subtle.digest(
        "SHA-256",
        zipBytes
    );

    // is it actually signed by the coolest, one and only, codedlunar?????

    const valid = await crypto.subtle.verify(
        {
            name: "Ed25519"
        },
        publicKey,
        signature,
        hash
    );

  if (!valid) {
        // WHY YOU HACK MY SERVERS :(((

        console.log("invalid")
        return { status: "INVALID" }
    }

    console.log("valid")

    return { status: "SUCCESS", blob: new Blob([zipBytes], { type: "application/zip" }) };
}

// Run verification

async function runUpdateCheck() {

    await wait(2000)

    result = await verifyZip(currentbrowser);

    const title = document.querySelector("#title");

    switch (result.status) {
        case "NETWORK_ERROR":
        case "HTTP_ERROR":
            title.textContent = "Could not download update files. Check your internet connection or if GitHub is down.";
            title.style.color = "orange";
            break;

        case "INVALID":
            title.textContent = "Signature of the zip is invalid, this file has been tampered with and is not official. Report this immediately.";
            title.style.color = "red";
            break;

        case "SUCCESS":
            title.textContent = "Signature of the zip is valid, this file has not been tampered with and is official.";
            title.style.color = "lime";

            setTimeout(() => {
                const url = URL.createObjectURL(result.blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `VoPro-main-${currentbrowser}.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            }, 2000);
            break;
    }
}

document.querySelector("#w").addEventListener("click", () => {
  alert('Safari/Webkit support is not out yet.')
})

let currentbrowser;

if (window.location.hash.substring(1) != '') {
    switch (window.location.hash.substring(1)) {
        case 'c':
            currentbrowser = 'chromium'
            break;
        case 'f':
            currentbrowser = 'firefox'
            break;
        case 'w':
            currentbrowser = 'webkit'
            break;
    }

    document.querySelector("#detect").textContent = `Choosen install for ${currentbrowser} browser`
    document.querySelector("#wrong").textContent = "Manually choose a browser version here:"
    document.querySelector("#defaultbulletpoint").style.display = 'inline'


    const defaultlink = document.createElement("a")
    defaultlink.textContent = "Default"
    defaultlink.onclick = `window.location.reload()`
    defaultlink.href = "/update/index.html"

    document.querySelector("#links-container").append(defaultlink)
} else {
    currentbrowser = browser
}


document.querySelector("#n-1").addEventListener("click", runUpdateCheck)
