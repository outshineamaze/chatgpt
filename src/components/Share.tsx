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
        alert("链接已经复制: " + shareLink)
      }
    } catch (err) {
      alert("请手动复制: " + finalShareLink)
      console.error("Failed to copy text: ", err);
    }
  };
  const shareSession = () => {
    alert("开发中")
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
          共享访问(50次问答)
        </button>
      </>
    </Show>
  );
};

export default ShareLinkButton;