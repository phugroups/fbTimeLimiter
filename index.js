let resources = {
    html: `
        <form id="globalForm">
            <h1></h1>
            <br>
            <div id="inputs">
                <input type="number" id="hours" min="0" max="11" title="Hours">
                <p>&nbsp:&nbsp</p>
                <input type="number" id="minutes" min="0" max="59" title="Minutes">
            </div>
            <br>
            <br>
            <h2 id="note1"></h2>
            <h2 id="note2"></h2>
        </form>
    `,

    extRes: {
        title: chrome.i18n.getMessage("title"),
        note1: chrome.i18n.getMessage("note1"),
        note2: chrome.i18n.getMessage("note2")
    }
};
resources.parsedHtml = new DOMParser().parseFromString(resources.html, "text/html").querySelector("form");

// Get data in storage and show to user
chrome.storage.local.get("timer", ({timer: a}) => {
    resources.parsedHtml.querySelector("#hours").value = a.hours;
    resources.parsedHtml.querySelector("#minutes").value = a.minutes;
});

// Listen when timer get change => call to background and do stuff
resources.parsedHtml.onchange = (a) => {
    let timer = {
        hours: Number(a.path[1].querySelector("#hours").value),
        minutes: Number(a.path[1].querySelector("#minutes").value),
        date: new Date().toDateString()
    };
    timer.totalSeconds = (timer.hours * 60 * 60) + (timer.minutes * 60);

    chrome.storage.local.set({timer: timer});
    chrome.runtime.sendMessage(chrome.runtime.id, "");
};

// Append Things...
resources.parsedHtml.querySelector("h1").innerHTML = resources.extRes.title;
resources.parsedHtml.querySelector("#note1").innerHTML = resources.extRes.note1;
resources.parsedHtml.querySelector("#note2").innerHTML = resources.extRes.note2;
document.querySelector("#global").appendChild(resources.parsedHtml);