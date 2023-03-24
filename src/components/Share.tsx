import { createSignal, onMount, Show } from 'solid-js'
import html2canvas from 'html2canvas';
import { BiRegularScreenshot, BiRegularShare, BiRegularShareAlt } from "solid-icons/bi";
import {  Modal } from "solid-bootstrap";
// ShareLinkButton component
const ShareLinkButton = () => {
  const [show, setShow] = createSignal(false);
  const [modalContent, setModalContent] = createSignal("");
  const handleOpen = (msg) => {
    setShow(true);
    setModalContent(msg)
  }
  const handleClose = () => {
    setShow(false);
    setModalContent("")
  }
  const copyToClipboard = async () => {
    let finalShareLink = ""
    try {
      const password = localStorage.getItem('pass')
      if (!password) {
        if (!password) {
          handleOpen("未登录用户暂时无法共享访问")
        }
      }
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
        handleOpen("链接已经复制(分享链接可以问答50次): " + shareLink)
      }
    } catch (err) {
      if (finalShareLink) {
        handleOpen("请手动复制(分享链接可以问答50次): " + finalShareLink)
      }
      console.error("Failed to copy text: ", err);
    }
  };
  const shareSession = async () => {
    let finalShareLink = ""
    try {
      const password = localStorage.getItem('pass')
      if (!password) {
        handleOpen("未登录用户暂时无法分享会话")
      }
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
          handleOpen("链接已经复制，仅分享当前页面最近的10次对话， 且分享链接内其他用户还能继续对话50次， 链接: " + shareLink)
        }
      } else {
        handleOpen("暂无会话可分享")
      }
    } catch (err) {
      if (finalShareLink) {
        handleOpen("请手动复制， 仅分享当前页面最近的10次对话， 且分享链接内其他用户还能继续对话50次， 链接: " + finalShareLink)
      }
      console.error("Failed to copy text: ", err);
    }
  }
  const capturePage = () => {

    // 获取当前页面的高度和宽度
    var pageHeight = document.documentElement.scrollHeight;
    var pageWidth = document.documentElement.scrollWidth;

    // 创建一个canvas对象，并设置它的宽度和高度
    var canvas = document.createElement('canvas');
    canvas.width = pageWidth;
    canvas.height = pageHeight;

    // 将当前页面渲染到canvas对象上
    html2canvas(document.documentElement).then(function (canvas) {
      // 将 Canvas 转换为 Data URL
      var dataURL = canvas.toDataURL('image/png');
      // 创建下载链接
      var downloadLink = document.createElement('a');
      downloadLink.href = dataURL;
      downloadLink.download = 'long-screenshot.png';
      // 触发下载操作
      downloadLink.click();
    });
  }
  return (
    <>
      <button onClick={capturePage} sys-edit-btn>
        <BiRegularScreenshot size={24} title="长截图" />截图
      </button>
 
        <button onClick={shareSession} sys-edit-btn>
          <BiRegularShare size={24} title="分享会话" />分享会话
        </button>

        <button onClick={copyToClipboard} sys-edit-btn>
          <BiRegularShareAlt size={24} title="分享访问链接" />共享访问
        </button>
      <Modal
        show={show()}
        onHide={handleClose}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
        </Modal.Header>
        <Modal.Body>
          {
            modalContent
          }
        </Modal.Body>
        <Modal.Footer>
        <button onClick={handleClose} dialog-submit-btn>
          确认
        </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ShareLinkButton;