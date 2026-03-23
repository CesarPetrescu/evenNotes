import { state } from '../state';

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Bridge timeout'));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

export function armClickCooldown(ms = 450) {
  state.clickCooldownUntil = Date.now() + ms;
}

export function isClickCooldownActive() {
  return Date.now() < state.clickCooldownUntil;
}
