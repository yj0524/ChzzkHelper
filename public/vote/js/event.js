const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const showAlertModal = (title, message) => {
    document.getElementById('alertTitle').innerText = title
    document.getElementById('modalContext').innerText = message
    new bootstrap.Modal(document.getElementById('alertModal')).show()
}

const selectRandomUser = () => {
    const users = document.getElementById('user-list').children
    if(!users || users.length < 2){
        showAlertModal('인원 부족', '추첨은 최소 2명 이상부터 가능합니다.')
        return
    }
    // TODO: 추첨 룰렛 효과
    showAlertModal('추첨 결과', `축하드립니다 ${users[random(0, users.length - 1)].innerText}님. 당첨되었습니다!`)
}

const addVoteItem = (input) => {
    const voteContext = input.value
    if(!voteContext){
        return
    }

    const list = document.querySelectorAll('#vote-item-list > li > input')
    if(list[list.length - 1] === input){
        input.value = ''
        const element = input.parentElement.cloneNode(true)
        input.parentElement.parentElement.appendChild(element)
        input.value = voteContext
        element.children[0].focus()

        const span = input.parentElement.children[1]
        span.innerHTML = 'X'
        span.style.cursor = 'pointer'
        span.onclick = (event) => {event.target.parentElement.remove()}
    }
}

const focusEvent = (event) => {
    if(document.getElementById('startBtn').disabled){
        return
    }
    addVoteItem(event.target)
}

const sendChat = () => {
    const input = document.getElementById(`chatting-input`)
    fetch(`http://${getRequestUrl()}/req/send_chat`, {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'post',
        body: JSON.stringify({
            message: input.value
        })
    }).then(res => {
        if(res.status !== 200){
            window.api.alert('ERROR!')
            return
        }
        input.value = ''
        input.focus()
    })
}