import { WebkitMessage, WebkitRequestType } from '../extension/websocket/MessageTypes';
import { WebkitWrapper } from '../webkit';

export async function handleWebkitMessage(message: WebkitMessage, webkitWrapper: WebkitWrapper): Promise<string> {
  switch (message.webkitRequestType) {
    case WebkitRequestType.SendMessage:
      return sendMessage(message, webkitWrapper);
    // case WebkitType.GetStorage:
    //   webkitWrapper.getStorage(message.extensionName, message.content);
    //   break;
    // case WebkitType.SetStorage:
    //   webkitWrapper.setStorage(message.extensionName, message.content);
    //   break;
    case WebkitRequestType.GetStorage: { throw new Error('Not implemented yet: WebkitType.GetStorage case'); }
    case WebkitRequestType.SetStorage: { throw new Error('Not implemented yet: WebkitType.SetStorage case'); }
    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unsupported webkit type: ${message.webkitRequestType}`);
  }
}

async function sendMessage(message: WebkitMessage, webkitWrapper: WebkitWrapper): Promise<string> {
  return webkitWrapper.sendMessage(message.extensionName, message.content);
}
