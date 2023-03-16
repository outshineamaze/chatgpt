import { onMount } from 'solid-js'

async function checkCurrentAuth() {
  const password = localStorage.getItem('pass')
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pass: password,
    }),
  })
  const responseJson = await response.json()
  if (responseJson.code !== 0) {
    window.location.href = '/password'
  }
}
export default () => {
  onMount(() => {
    try {
      checkCurrentAuth()
    } catch (err) {
      console.error(err)
    }
  })

  return null;
}
