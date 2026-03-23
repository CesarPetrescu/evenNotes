import './styles.css';

import { RUNTIME_VERSION } from './constants';
import { pushLog, renderApp } from './render';
import { connectWebSocket } from './websocket';
import { connectBridge } from './bridge/connect';
import { setupKeyboardListeners } from './events';

setupKeyboardListeners();

window.addEventListener('evenAppBridgeReady', () => {
  void connectBridge();
}, { once: true });

pushLog(`Runtime ${RUNTIME_VERSION}`);
renderApp();
connectWebSocket();
void connectBridge();
