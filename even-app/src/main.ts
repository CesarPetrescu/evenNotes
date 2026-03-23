import './styles.css';
import { state } from './state';
import { log, renderApp } from './render';
import { connectWebSocket } from './websocket';
import {
  connectBridge,
  currentMenuOptions,
  enterDetail,
  openMenu,
  executeMenu,
  closeMenu,
  moveList
} from './glasses';

document.addEventListener('keydown', (e) => {
  switch (state.view) {
    case 'list':
      if (e.key === 'ArrowDown') { e.preventDefault(); moveList(1); renderApp(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); moveList(-1); renderApp(); }
      if (e.key === 'Enter' && state.notes.length > 0) {
        e.preventDefault();
        enterDetail(state.listPage * 6 + state.selectedIndex);
      }
      break;

    case 'detail':
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMenu(0); }
      break;

    case 'menu': {
      const options = currentMenuOptions();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.menuDefault = Math.min(state.menuDefault + 1, options.length - 1);
        renderApp();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.menuDefault = Math.max(state.menuDefault - 1, 0);
        renderApp();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        executeMenu(options[state.menuDefault].action);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
      }
      break;
    }

    case 'image':
      // Any key goes back to detail
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        state.view = 'detail';
        renderApp();
      }
      break;
  }
});

window.addEventListener('evenAppBridgeReady', () => void connectBridge(), { once: true });

log('Runtime 0.4.0');
renderApp();
connectWebSocket();
void connectBridge();
