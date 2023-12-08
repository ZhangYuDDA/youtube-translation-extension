const HOST = "tmt.tencentcloudapi.com";
const TRANSLATE_URL = "https://" + HOST;

async function translateText(text, source, target) {
    const payload = JSON.stringify({
        SourceText: text,
        Source: source,
        Target: target,
        ProjectId: 0
    })
    const timestamp = Math.floor(new Date() / 1000);
    const authorization = await getAuthorization(payload, timestamp);
    const requestOption = {
        method: "POST",
        headers: {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Host": HOST,
            "X-TC-Action": "TextTranslate",
            "X-TC-Version": "2018-03-21",
            "X-TC-Timestamp": timestamp,
            "X-TC-Region": "ap-guangzhou"
        },
        body: payload
    }
    return fetch(TRANSLATE_URL, requestOption)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
        })
        .then(data => {
            return data.Response.TargetText;
        })
}

async function sha256(message, secret, encoding = '') {
    const key = await crypto.subtle.importKey("raw", secret,
        {
            name: "HMAC",
            hash: "SHA-256"
        }, false, ["sign", "verify"],);
    let enc = new TextEncoder();
    let encoded = enc.encode(message);

    let signature = await crypto.subtle.sign("HMAC", key, encoded);
    if (encoding === 'hex') {
        const hashArray = Array.from(new Uint8Array(signature)); // convert buffer to byte array
        signature = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""); // convert bytes to hex string
    }
    return signature;
}

async function getHash(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

function getDate(timestamp) {
    const date = new Date(timestamp * 1000)
    const year = date.getUTCFullYear()
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2)
    const day = ('0' + date.getUTCDate()).slice(-2)
    return `${year}-${month}-${day}`
}

async function getAuthorization(payload, timestamp) {

    const endpoint = HOST
    const service = "tmt"
    const region = "ap-guangzhou"
    const action = "TextTranslate"
    const version = "2017-03-12"
    //时间处理, 获取世界时间日期
    const date = getDate(timestamp)

    // ************* 步骤 1：拼接规范请求串 *************

    const hashedRequestPayload = await getHash(payload);
    const httpRequestMethod = "POST"
    const canonicalUri = "/"
    const canonicalQueryString = ""
    const canonicalHeaders = "content-type:application/json\n"
        + "host:" + endpoint + "\n"
        + "x-tc-action:" + action.toLowerCase() + "\n"
    const signedHeaders = "content-type;host;x-tc-action"

    const canonicalRequest = httpRequestMethod + "\n"
        + canonicalUri + "\n"
        + canonicalQueryString + "\n"
        + canonicalHeaders + "\n"
        + signedHeaders + "\n"
        + hashedRequestPayload
    //console.log(canonicalRequest)

    // ************* 步骤 2：拼接待签名字符串 *************
    const algorithm = "TC3-HMAC-SHA256"
    const hashedCanonicalRequest = await getHash(canonicalRequest);
    const credentialScope = date + "/" + service + "/" + "tc3_request"
    const stringToSign = algorithm + "\n" +
        timestamp + "\n" +
        credentialScope + "\n" +
        hashedCanonicalRequest
    //console.log(stringToSign)

    // ************* 步骤 3：计算签名 *************
    const kDate = await sha256(date, new TextEncoder().encode('TC3' + SECRET_KEY))
    const kService = await sha256(service, kDate)
    const kSigning = await sha256('tc3_request', kService)
    const signature = await sha256(stringToSign, kSigning, 'hex')
    //console.log(signature)

    // ************* 步骤 4：拼接 Authorization *************
    const authorization = algorithm + " " +
        "Credential=" + SECRET_ID + "/" + credentialScope + ", " +
        "SignedHeaders=" + signedHeaders + ", " +
        "Signature=" + signature
    //console.log(authorization)

    return authorization
}