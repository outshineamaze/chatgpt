
// ShareLinkButton component
const ShareLinkButton = () => {
  const password = localStorage.getItem('pass')
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
        }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  return (
    password ? (<button onClick={copyToClipboard} gen-slate-btn>
      ShareLink
    </button>) : null
    
  );
};

export default ShareLinkButton;