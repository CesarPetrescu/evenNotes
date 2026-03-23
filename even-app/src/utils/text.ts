export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function truncate(text: string, limit: number) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, Math.max(0, limit - 3))}...`;
}

export function singleLine(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function normalizeGlassesText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

export function wrapGlassesLine(line: string, maxLength: number) {
  const normalized = normalizeGlassesText(line).trim();

  if (!normalized) {
    return [''];
  }

  const output: string[] = [];
  let remaining = normalized;

  while (remaining.length > maxLength) {
    const candidates = [' ', '/', '-', '_', '.', ',', '|']
      .map((character) => remaining.lastIndexOf(character, maxLength))
      .filter((index) => index >= Math.floor(maxLength * 0.45));
    const breakIndex = candidates.length > 0 ? Math.max(...candidates) + 1 : maxLength;
    const chunk = remaining.slice(0, breakIndex).trimEnd();

    output.push(chunk);
    remaining = remaining.slice(breakIndex).trimStart();
  }

  if (remaining) {
    output.push(remaining);
  }

  return output;
}

export function wrapTextForGlasses(text: string, maxLength: number, maxLines: number, maxChars: number) {
  const lines = normalizeGlassesText(text).split('\n');
  const output: string[] = [];
  let truncated = false;

  for (const line of lines) {
    const wrapped = wrapGlassesLine(line, maxLength);

    for (const chunk of wrapped) {
      if (output.length >= maxLines) {
        truncated = true;
        break;
      }

      output.push(chunk);
    }

    if (truncated) {
      break;
    }
  }

  let result = output.join('\n').trimEnd();

  if (result.length > maxChars) {
    result = result.slice(0, Math.max(0, maxChars - 3)).trimEnd();
    truncated = true;
  }

  if (truncated) {
    const suffix = result.includes('\n') ? '\n...' : ' ...';
    const available = Math.max(0, maxChars - suffix.length);
    result = `${result.slice(0, available).trimEnd()}${suffix}`;
  }

  return result || '(empty)';
}
