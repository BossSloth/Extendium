import { StorageClearContent, StorageGetSetContent, StorageRemoveContent, WebkitMessage, WebkitRequestType } from '../extension/websocket/MessageTypes';
import { WebkitWrapper } from '../webkit';

export async function handleWebkitMessage(message: WebkitMessage, webkitWrapper: WebkitWrapper): Promise<unknown> {
  switch (message.webkitRequestType) {
    case WebkitRequestType.SendMessage:
      return sendMessage(message, webkitWrapper);
    case WebkitRequestType.GetStorage:
      return getStorage(message, webkitWrapper);
    case WebkitRequestType.SetStorage:
      return setStorage(message, webkitWrapper);
    case WebkitRequestType.RemoveStorage:
      return removeStorage(message, webkitWrapper);
    case WebkitRequestType.ClearStorage:
      return clearStorage(message, webkitWrapper);
    case WebkitRequestType.OpenOptions:
      openOptions(message, webkitWrapper);
      break;
    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unsupported webkit type: ${message.webkitRequestType}`);
  }

  return null;
}

async function sendMessage(message: WebkitMessage, webkitWrapper: WebkitWrapper): Promise<string> {
  return webkitWrapper.sendMessage(message.extensionName, message.content);
}

async function getStorage(message: WebkitMessage, webkitWrapper: WebkitWrapper): Promise<unknown> {
  return webkitWrapper.getStorage(message.extensionName, message.content as StorageGetSetContent);
}

async function setStorage(message: WebkitMessage, webkitWrapper: WebkitWrapper): Promise<void> {
  return webkitWrapper.setStorage(message.extensionName, message.content as StorageGetSetContent);
}

async function removeStorage(message: WebkitMessage, webkitWrapper: WebkitWrapper): Promise<void> {
  return webkitWrapper.removeStorage(message.extensionName, message.content as StorageRemoveContent);
}

async function clearStorage(message: WebkitMessage, webkitWrapper: WebkitWrapper): Promise<void> {
  return webkitWrapper.clearStorage(message.extensionName, message.content as StorageClearContent);
}

function openOptions(message: WebkitMessage, webkitWrapper: WebkitWrapper): void {
  webkitWrapper.openOptions(message.extensionName);
}
