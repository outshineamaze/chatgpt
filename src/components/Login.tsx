import 'solid-js'
import { cryptPasswrod } from '@/utils/auth'
async function handleSubmit(password) {
  const cryptPasswrodStrig = await cryptPasswrod(password)
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pass: cryptPasswrodStrig,
    }),
  })
  const responseJson = await response.json()
  if (responseJson.code === 0) {
    localStorage.setItem('pass', cryptPasswrodStrig)
    window.location.href = '/'
  }
}
export default () => {
  let inputRef: HTMLInputElement
  const handleButtonClick = () => {
    const inputValue = inputRef.value
    if (!inputValue) {
      return
    }
    handleSubmit(inputValue)
  }
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey) {
      return
    }
    if (e.key === 'Enter') {
      handleButtonClick()
    }
  }
  return (
    <main class="h-screen col-fcc">
    <div class="op-30">Please input password</div>
    <div id="input_container" class="flex mt-4">
      <input id="password_input" type="password" class="gpt-password-input" ref={inputRef!} onKeyDown={handleKeydown} />
      <div id="submit" class="gpt-password-submit" onClick={handleButtonClick}>
        <div class="i-carbon-arrow-right" />
      </div>
    </div>
  </main>
  );
}
