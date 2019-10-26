chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        timer: {
            hours: 0,
            minutes: 0,
            totalSeconds: 0,
            date: new Date().toDateString()
        }
    }, () => console.log("Timer set to 0:0."));
});

// Declares
let global = {
    block: false,
    blocker: () => ({cancel: true}),
    blocked: false,
    URLs: chrome.runtime.getManifest().permissions.filter((a) => a.includes("://"))
};
global.URLsRegex = global.URLs.map((a) => new RegExp(a.replace(/(\/\*$|\*:\/\/\*\.)/g, "").replace(".", "\\.")));
function createNoti() {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icons8-clock-512-01.png",
        title: chrome.i18n.getMessage("extName"),
        message: chrome.i18n.getMessage("blockMessage")
    });
}
Array.prototype.testAll = function(data) {
	switch(typeof(data)) {
        case "string":
			return !!this.filter((regex) => regex.test(data)).length;
			break;
        case "object":
			return !!this.filter((regex) => !!data.filter((str) => regex.test(str)).length).length;
			break;
    }
}

// Get data from local storage
chrome.storage.local.get("timer", ({timer: a}) => {
    for (let b in a) {
        global[b] = a[b];
    }

    // Reset timer every day, just check at when extension start
    let date = new Date().toDateString();
    if (global.date !== date) {
        global.date = date;
        global.totalSeconds = (global.hours * 60 * 60) + (global.minutes * 60);
    }
});

// Listen when timer change => change global object
chrome.runtime.onMessage.addListener(() => {
    chrome.storage.local.get("timer", ({timer: a}) => {
        for (let b in a) {
            global[b] = a[b];
        }
    });
});

// Do stuff at every seconds
setInterval(() => {
    // Check / set date at every seconds | if date different -> set new timer 
    let date = new Date().toDateString();
    if (global.date !== date) {
        global.date = date;
        global.totalSeconds = (global.hours * 60 * 60) + (global.minutes * 60);
    }
    chrome.storage.local.set({
        timer: {
            hours: global.hours,
            minutes: global.minutes,
            totalSeconds: global.totalSeconds,
            date: global.date
        }
    });
    chrome.browserAction.setBadgeText({
        text: String(Math.floor(global.totalSeconds / 60)) + "m"
    });
    if (global.hours == 0 && global.minutes == 0 && global.block && global.blocked) { // Timer to 0:0 + still blocking -> unblock
        global.block = false;
        global.blocked = false;
        chrome.webRequest.onBeforeRequest.removeListener(global.blocker);
    } else if (global.hours !== 0 || global.minutes !== 0) {
        chrome.tabs.query({}, (a) => {
            let c = global.URLsRegex.testAll(a.map((b) => new URL(b.url).origin));
            if (c) {
                if (!global.block && global.totalSeconds > 0) {
                    --global.totalSeconds;
                } else if (global.block && global.totalSeconds > 0) {
                    --global.totalSeconds;
                    global.block = false;
                } else if (global.totalSeconds == 0) {
                    global.block = true;
                }

                if (global.block && global.blocked == false) {
                    global.blocked = true;
                    createNoti();
                    chrome.webRequest.onBeforeRequest.addListener(global.blocker, {urls: global.URLs, types: ["main_frame"]}, ["blocking"]);
                } else if (!global.block) {
                    global.blocked = false;
                    chrome.webRequest.onBeforeRequest.removeListener(global.blocker);
                }
            }
        });
    }
}, 1000);