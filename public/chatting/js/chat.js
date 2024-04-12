let client, messageProcessCount = 0
const playList = [] // Audio[]

const getRequestUrl = () => window.localStorage.getItem('wsURL') || location.host

const findRepeatedText = (str) => {
    const len = Math.ceil(str.length / 4)
    for(let i = 1; i <= len; ++i){ // 문자열의 길이의 1/4 까지만 확인(4회이상 반복시를 판단하기 위해서임)
        let index = 0, count = 1
        const substring = str.substring(0, i)
        while((index = str.indexOf(substring, index + i)) !== -1){
            ++count;
        }
        if(count > 3 && count * substring.length === str.length){
            return {substring, count};
        }
    }
    return null;
}

const playTTS = (text) => {
    const url = localStorage.getItem('ttsURL') || ''
    if(!url.includes('${text}')){
        return
    }

    const sound = new Audio(url.replaceAll('${text}', encodeURIComponent(text)))
    sound.onended = () => {
        playList.splice(playList.indexOf(sound), 1);
        if(playList.length > 0){
            playList[0].play()
        }
    }
    playList.push(sound)
    if(playList.length === 1){
        sound.play()
    }
}

const escapeHTML = (text) => text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const connect = () => {
    if(client?.readyState === WebSocket.OPEN){
        return;
    }
    client = new WebSocket(`ws://${getRequestUrl()}/ws`)
    client.onopen = () => client.send(`CHATTING`)
    client.onmessage = e => {
        const json = (() => {
            try{
                return JSON.parse(e.data.toString())
            }catch{}
        })()

        if(typeof json !== 'object'){
            return
        }

        let delay = 70
        if(++messageProcessCount >= 50){
            delay = 0
        }else if(messageProcessCount >= 30){
            delay = 10
        }else if(messageProcessCount >= 15){
            delay = 20
        }else if(messageProcessCount > 5){
            delay = 45
        }
        setTimeout(() => {
            const messageBoxDiv = document.createElement('div')
            messageBoxDiv.className = 'messageBox'
            document.body.appendChild(messageBoxDiv)

            setTimeout(() => messageBoxDiv.style.opacity = '1', 50)

            for(const badgeUrl of json.badgeList){
                const badgeImg = document.createElement('img')
                badgeImg.src = badgeUrl
                messageBoxDiv.appendChild(badgeImg)
            }

            const userSpan = document.createElement('span')
            userSpan.className = 'nickname'
            userSpan.innerText = json.nickname
            userSpan.style.color = json.color
            messageBoxDiv.appendChild(userSpan)

            const messageSpan = document.createElement('span')
            messageSpan.className = 'message'

            let message = escapeHTML(json.message)
            for(const emojiName in json.emojiList){
                message = message.replaceAll(`{:${emojiName}:}`, `<img src='${json.emojiList[emojiName]}'>`)
            }
            messageSpan.innerHTML = ` : ${message}`
            messageBoxDiv.appendChild(messageSpan)
    
            --messageProcessCount
            if(json.nickname.endsWith('봇')){ // TODO: tts expection
                return
            }

            const repeatData = findRepeatedText(json.message)
            if(repeatData){
                const {substring, count} = repeatData
                playTTS(substring.repeat(substring.length < 3 ? Math.min(count, 8) : 3))
            }else{
                playTTS(json.message)
            }
        }, delay)
    }
    client.onclose = () => setTimeout(() => connect(), 1000)
}
window.addEventListener('load', () => connect())