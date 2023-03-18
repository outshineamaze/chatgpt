import { createSignal, onMount } from 'solid-js'
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
            await navigator.clipboard.writeText(shareLink);
            alert("链接已经复制: " + shareLink)
        }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  return (
    hasPass ? (<button onClick={copyToClipboard} gen-slate-btn>
      ShareLink
    </button>) : null
  );
};

export default ShareLinkButton;