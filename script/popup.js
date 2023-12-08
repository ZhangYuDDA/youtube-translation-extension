const cloesBtn = document.getElementById("closeBtn");
const openBtn = document.getElementById("openBtn");
const sourceS = document.getElementById("sourceS");
const targetS = document.getElementById("targetS");

let tabId = 0;
let source = "en";
let target = "zh";
let state = "closed";

getCurrentTab().then((tab) => {
    tabId = tab.id;
    chrome.storage.session.get(["tab-" + tab.id]).then(val => {
        if (Object.keys(val).length === 0) {
            val = { ["tab-" + tab.id]: { source: "en", target: "zh", state: "closed" } };
            chrome.storage.session.set({ ["tab-" + tab.id]: { source: "en", target: "zh", state: "closed" } });
        }
        if (val["tab-" + tab.id].state === "closed") {
            cloesBtn.disabled = true;
            openBtn.disabled = false;
        } else {
            cloesBtn.disabled = false;
            openBtn.disabled = true;
        }
        source = val["tab-" + tab.id].source;
        target = val["tab-" + tab.id].target;
        state = val["tab-" + tab.id].state;
        sourceS.value = source;
        targetS.value = target;

    })

})

function showTranslationText(source, target) {
    var container = document.getElementById("ytp-caption-window-container");
    if (container) {
        const translationObserver = new MutationObserver(mutations => {
            translationObserver.disconnect();
            var subtitles = document.querySelectorAll(".caption-window .ytp-caption-segment");
            if (subtitles.length !== 0) {
                let message = { source: source, target: target };
                for (var i = 0; i < subtitles.length; i++) {
                    let subtitlesDom = subtitles[i];
                    message.text = subtitles[i].innerHTML
                    chrome.runtime.sendMessage(
                        {
                            message: message
                        },
                        (response) => {
                            subtitlesDom.innerHTML = response
                        }
                    );
                }
            }
            translationObserver.observe(container, {
                childList: true
            });
        })
        translationObserver.observe(container, {
            childList: true
        });
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message === 'close') {
                translationObserver.disconnect();
            }
        })
    }
}


function closeTranslation() {
    if (typeof translationObserver !== 'undefined') {
        console.log("jinqule ")
        translationObserver.disconnect();
    }
}


async function getCurrentTab() {
    let queryOptions = { active: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

cloesBtn.onclick = () => {
    state = "closed";
    cloesBtn.disabled = true;
    openBtn.disabled = false;
    chrome.storage.session.set({ ["tab-" + tabId]: { source: source, target: target, state: state } });
    chrome.tabs.sendMessage(tabId, 'close')
}
openBtn.onclick = () => {
    state = "opend";
    openBtn.disabled = true;
    cloesBtn.disabled = false;
    chrome.storage.session.set({ ["tab-" + tabId]: { source: source, target: target, state: state } });
    chrome.scripting.executeScript({
        target: { tabId: tabId, },
        func: showTranslationText,
        args: [source, target]
    })
}

sourceS.onchange = () => {
    source = this.value;
    chrome.storage.session.set({ ["tab-" + tabId]: { source: source, target: target, state: state } });
}

targetS.onchange = () => {
    target = this.value;
    chrome.storage.session.set({ ["tab-" + tabId]: { source: source, target: target, state: state } });
}