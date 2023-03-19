import { createSignal, onMount, Show } from 'solid-js'
// ShareLinkButton component
const ShareLinkButton = () => {
  const [hasPass, setHasPass] = createSignal(false)
  onMount(() => {
    try {
      if (localStorage.getItem('pass')) {
        setHasPass(true)
      }
    } catch (err) {
      console.error(err)
    }
  })
  const copyToClipboard = async () => {
    let finalShareLink = ""
    try {
      const password = localStorage.getItem('pass')
      const response = await fetch('/api/gensharelink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pass: password,
        }),
      })
      const responseJson = await response.json()
      if (responseJson.code === 0) {
        const shareLink = responseJson.sharelink;
        finalShareLink = shareLink
        await navigator.clipboard.writeText(shareLink);
        alert("链接已经复制(分享链接可以问答50次): " + shareLink)
      }
    } catch (err) {
      if(finalShareLink) {
        alert("请手动复制(分享链接可以问答50次): " + finalShareLink)
      }
      console.error("Failed to copy text: ", err);
    }
  };
  const shareSession = async () => {
    let finalShareLink = ""
    try {
      const password = localStorage.getItem('pass')
      const messageList = JSON.parse(localStorage.getItem('messageList'))
      if (Array.isArray(messageList) && messageList.length >= 2) {
        const response = await fetch('/api/gensharelink', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pass: password,
            messageList: messageList.slice(-20)
          }),
        })
        const responseJson = await response.json()
        if (responseJson.code === 0) {
          const shareLink = responseJson.sharelink;
          finalShareLink = shareLink
          await navigator.clipboard.writeText(shareLink);
          alert("链接已经复制，仅分享当前页面最近的10次对话， 且分享链接内其他用户还能继续对话50次， 链接: " + shareLink)
        }
      }
    } catch (err) {
      if(finalShareLink) {
        alert("请手动复制， 仅分享当前页面最近的10次对话， 且分享链接内其他用户还能继续对话50次， 链接: " + finalShareLink)
      }
      console.error("Failed to copy text: ", err);
    }
  }
  return (
    <Show
      when={hasPass()}
    >
      <>
        <button onClick={shareSession} gen-slate-btn>
          分享该会话
        </button>
        <button onClick={copyToClipboard} gen-slate-btn>
          分享访问链接
        </button>
      </>
    </Show>
  );
};

export default ShareLinkButton;