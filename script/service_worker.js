importScripts('./env.js')
importScripts('./translate.js');
/*chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "OFF",
    });
});*/

const URL_PREDIX = "https://www.youtube.com/watch";
chrome.action.onClicked.addListener(async (tab) => {
    console.log("haha");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    translateText(message.message.text, message.message.source, message.message.target).then(sendResponse);
    return true;  // 防止出现port已经关闭的错误
});

