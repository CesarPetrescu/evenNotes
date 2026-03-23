import {
  OsEventTypeList,
  StartUpPageCreateResult
} from '@evenrealities/even_hub_sdk';

export function isStartupCreateSuccess(result: unknown) {
  return Number(result) === StartUpPageCreateResult.success;
}

export function isTruthyResult(result: unknown) {
  if (typeof result === 'string') {
    const normalized = result.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }

  return Boolean(result);
}

export function isClickLike(eventType: OsEventTypeList | undefined) {
  return eventType === undefined
    || eventType === OsEventTypeList.CLICK_EVENT
    || eventType === OsEventTypeList.DOUBLE_CLICK_EVENT;
}

export function isImageUpdateSuccess(result: unknown) {
  const normalized = String(result).trim().toLowerCase();
  return result === 0
    || result === true
    || normalized === '0'
    || normalized === 'true'
    || normalized.endsWith('success');
}
