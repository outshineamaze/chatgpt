import type { ChatMessage } from '@/types'
import { createSignal, Index, Show, onMount, onCleanup } from 'solid-js'
import IconClear from './icons/Clear'
import MessageItem from './MessageItem'
import SystemRoleSettings from './SystemRoleSettings'
import { generateSignature } from '@/utils/auth'
import { useThrottleFn } from 'solidjs-use'
import ShareLinkButton from './Share'
import { BiRegularSend } from "solid-icons/bi";

const isSafari = () => {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const  isWebkit = /webkit/i.test(navigator.userAgent);
  if (isSafari && isWebkit) {
    return true
  } else {
    return false;
  }
}

export default () => {
  let inputRef: HTMLTextAreaElement
  const [currentSystemRoleSettings, setCurrentSystemRoleSettings] = createSignal('')
  const [systemRoleEditing, setSystemRoleEditing] = createSignal(false)
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([])
  const [currentAssistantMessage, setCurrentAssistantMessage] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [controller, setController] = createSignal<AbortController>(null)


  const checkCurrentAuth = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareLinkIdFromUrl =urlParams.get("share_link_id");
    if (shareLinkIdFromUrl) {
      const urlWithoutParams = window.location.origin + window.location.pathname;
      const responseJson = await fetchAuth(undefined, undefined, shareLinkIdFromUrl)
      if (responseJson.code !== 0) {
        window.location.href = '/'
        return
      }
      localStorage.setItem("shareLinkId", shareLinkIdFromUrl);
      if (Array.isArray(responseJson.messageList) && responseJson.messageList.length >= 2) {
        setMessageList(responseJson.messageList)
      }
      window.history.replaceState({}, document.title, urlWithoutParams);
      return
    }

    const password = localStorage.getItem('pass')
    if (password) {
      const responseJson = await fetchAuth(undefined, password)
      if (responseJson.code !== 0) {
        localStorage.removeItem('pass')
        window.location.href = '/password'
        return
      }
      return
    }
  
    const localShareLinkId = localStorage.getItem('shareLinkId')
    if (localShareLinkId) {
      const responseJson = await fetchAuth(localShareLinkId)
      if (responseJson.code !== 0) {
        localStorage.removeItem("shareLinkId");
        window.location.href = '/password'
        return
      }
      return
    }
    window.location.href = '/password'
  }

  onMount(() => {
    try {
      if (localStorage.getItem('messageList')) {
        setMessageList(JSON.parse(localStorage.getItem('messageList')))
      }
      if (localStorage.getItem('systemRoleSettings')) {
        setCurrentSystemRoleSettings(localStorage.getItem('systemRoleSettings'))
      }
      checkCurrentAuth()
    } catch (err) {
      console.error(err)
    }
    let timer
      timer = setInterval(()=>{
        handleBeforeUnload()
      }, 3000)
    window.addEventListener('beforeunload', handleBeforeUnload)
    onCleanup(() => {
      clearInterval(timer)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })
  })

  const handleBeforeUnload = () => {
    localStorage.setItem('messageList', JSON.stringify(messageList()))
    localStorage.setItem('systemRoleSettings', currentSystemRoleSettings())
  }

  const handleButtonClick = async () => {
    const inputValue = inputRef.value
    if (!inputValue) {
      return
    }
    // @ts-ignore
    if (window?.umami) umami.trackEvent('chat_generate')
    inputRef.value = ''
    setMessageList([
      ...messageList(),
      {
        role: 'user',
        content: inputValue,
      },
    ])
    requestWithLatestMessage()
  }

  const smoothToBottom = useThrottleFn(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, 300, false, true)

  const requestWithLatestMessage = async () => {
    setLoading(true)
    setCurrentAssistantMessage('')
    const storagePassword = localStorage.getItem('pass')
    const shareLinkId = localStorage.getItem('shareLinkId')
    
    try {
      const controller = new AbortController()
      setController(controller)
      const requestMessageList = [...messageList()]
      if (currentSystemRoleSettings()) {
        requestMessageList.unshift({
          role: 'system',
          content: currentSystemRoleSettings(),
        })
      }
      const timestamp = Date.now()
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          messages: requestMessageList,
          time: timestamp,
          pass: storagePassword,
          share_link_id: shareLinkId ? shareLinkId : undefined,
          sign: await generateSignature({
            t: timestamp,
            m: requestMessageList?.[requestMessageList.length - 1]?.content || '',
          }),
        }),
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      const data = response.body
      if (!data) {
        throw new Error('No data')
      }
      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) {
          let char = decoder.decode(value)
          if (char === '\n' && currentAssistantMessage().endsWith('\n')) {
            continue
          }
          if (char) {
            setCurrentAssistantMessage(currentAssistantMessage() + char)
          }
          smoothToBottom()
        }
        done = readerDone
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
      setController(null)
      return
    }
    archiveCurrentMessage()
  }

  const archiveCurrentMessage = () => {
    if (currentAssistantMessage()) {
      setMessageList([
        ...messageList(),
        {
          role: 'assistant',
          content: currentAssistantMessage(),
        },
      ])
      setCurrentAssistantMessage('')
      setLoading(false)
      setController(null)
      inputRef.focus()
    }
  }

  const clear = () => {
    inputRef.value = ''
    inputRef.style.height = 'auto';
    setMessageList([])
    setCurrentAssistantMessage('')
    setCurrentSystemRoleSettings('')
    handleBeforeUnload()
  }

  const stopStreamFetch = () => {
    if (controller()) {
      controller().abort()
      archiveCurrentMessage()
    }
  }

  const retryLastFetch = () => {
    if (messageList().length > 0) {
      const lastMessage = messageList()[messageList().length - 1]
      console.log(lastMessage)
      if (lastMessage.role === 'assistant') {
        setMessageList(messageList().slice(0, -1))
        requestWithLatestMessage()
      }
    }
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
    <div my-6>
      <SystemRoleSettings
        canEdit={() => messageList().length === 0}
        systemRoleEditing={systemRoleEditing}
        setSystemRoleEditing={setSystemRoleEditing}
        currentSystemRoleSettings={currentSystemRoleSettings}
        setCurrentSystemRoleSettings={setCurrentSystemRoleSettings}
      />
      <Index each={messageList()}>
        {(message, index) => (
          <MessageItem
            role={message().role}
            message={message().content}
            showRetry={() => (message().role === 'assistant' && index === messageList().length - 1)}
            onRetry={retryLastFetch}
          />
        )}
      </Index>
      {currentAssistantMessage() && (
        <MessageItem
          role="assistant"
          message={currentAssistantMessage}
        />
      )}
      <Show
        when={!loading()}
        fallback={() => (
          <div class="gen-cb-wrapper">
            <span>AI is thinking...</span>
            <div class="gen-cb-stop" onClick={stopStreamFetch}>Stop</div>
          </div>
        )}
      >
        <div class="gen-text-wrapper" class:op-50={systemRoleEditing()}>
          <textarea
            ref={inputRef!}
            disabled={systemRoleEditing()}
            onKeyDown={handleKeydown}
            placeholder="Enter something..."
            autocomplete="off"
            autofocus
            onInput={() => {
              inputRef.style.height = 'auto';
              inputRef.style.height = inputRef.scrollHeight + 'px';
            }}
            rows="1"
            class='gen-textarea'
          />
          <br/>
          <button onClick={handleButtonClick} disabled={systemRoleEditing()} gen-slate-btn>
            <BiRegularSend size={24} title="分享会话" />
          </button>
          <button title="Clear" onClick={clear} disabled={systemRoleEditing()} gen-slate-btn>
            <IconClear />
          </button>
        </div>
        <div class="gen-text-wrapper fb" class:op-50={systemRoleEditing()}>
          <ShareLinkButton/>
        </div>
      </Show>
    </div>
  )
}
async function fetchAuth(localShareLinkId?: string, password?: string, shareLinkIdFromURl?:string) {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pass: password,
      share_link_id: localShareLinkId,
      share_link_id_from_url: shareLinkIdFromURl,
    })
  })
  const responseJson = await response.json()
  return responseJson
}

