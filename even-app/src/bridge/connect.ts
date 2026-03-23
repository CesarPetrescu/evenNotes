import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk';
import { BRIDGE_WAIT_MS } from '../constants';
import { state } from '../state';
import { withTimeout } from '../utils/timing';
import { pushLog, renderApp } from '../render';
import { scheduleBridgeSync } from './sync';
import { handleEvenHubEvent } from '../events';

export async function connectBridge() {
  if (state.bridge) {
    return;
  }

  try {
    const bridge = await withTimeout(waitForEvenAppBridge(), BRIDGE_WAIT_MS);
    state.bridge = bridge;
    state.bridgeConnected = true;
    bridge.onEvenHubEvent(handleEvenHubEvent);
    pushLog('Even Hub bridge connected');
    scheduleBridgeSync();
  } catch {
    if (!state.bridgeConnected) {
      renderApp();
    }
  }
}
