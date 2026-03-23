import {
  CreateStartUpPageContainer,
  ImageRawDataUpdate,
  RebuildPageContainer
} from '@evenrealities/even_hub_sdk';
import type { PageKind } from '../types';
import { state } from '../state';
import { getDiagramKind } from '../diagrams/detection';
import { detailDateStamp, activeDetailNote } from '../utils/notes';
import { isStartupCreateSuccess, isTruthyResult, isImageUpdateSuccess } from './helpers';
import { buildBootstrapPage, buildGlassesPage, buildTextDetailPage } from './pages';
import { pushLog, renderApp } from '../render';

export async function rebuildToTextFallback(noteId: string) {
  if (!state.bridge) {
    return false;
  }

  const note = activeDetailNote();
  if (!note || note.id !== noteId || state.view !== 'detail') {
    return false;
  }

  if (getDiagramKind(note) || note.image) {
    state.visualFallbackNoteId = noteId;
  }
  renderApp();

  const fallbackPage = new RebuildPageContainer(buildTextDetailPage(note, detailDateStamp(note), true));
  const success = await state.bridge.rebuildPageContainer(fallbackPage);

  if (!isTruthyResult(success)) {
    pushLog('Fallback rebuild failed on detail-text');
    return false;
  }

  state.lastSyncLabel = `detail-text ${state.detailNoteIndex + 1}/${state.notes.length}`;
  pushLog('Fell back to detail-text');
  return true;
}

export function scheduleBridgeSync() {
  if (!state.bridge) {
    return;
  }

  state.bridgeSync = state.bridgeSync
    .then(async () => {
      if (!state.bridge) {
        return;
      }

      const page = await buildGlassesPage();
      if (state.lastSyncLabel !== page.syncLabel) {
        state.lastSyncLabel = page.syncLabel;
        pushLog(`Sync target: ${page.syncLabel}`);
      }

      if (!state.startupCreated) {
        const bootstrapKind: PageKind = state.notes.length === 0 ? 'empty' : 'list';
        const bootstrapDefinition = buildBootstrapPage();
        const bootstrapCreate = new CreateStartUpPageContainer(bootstrapDefinition);
        const bootstrapRebuild = new RebuildPageContainer(bootstrapDefinition);
        const result = await state.bridge.createStartUpPageContainer(bootstrapCreate);

        if (isStartupCreateSuccess(result)) {
          state.startupCreated = true;
        } else {
          const rebuildResult = await state.bridge.rebuildPageContainer(bootstrapRebuild);

          if (!isTruthyResult(rebuildResult)) {
            pushLog(`Create failed on bootstrap ${bootstrapKind} (${String(result)})`);
            return;
          }

          state.startupCreated = true;
          pushLog(`Create fallback via rebuild on bootstrap ${bootstrapKind} (${String(result)})`);
        }

        if (page.pageKind === bootstrapKind) {
          return;
        }
      }

      const success = await state.bridge.rebuildPageContainer(page.rebuild);

      if (!isTruthyResult(success)) {
        pushLog(`Rebuild failed on ${page.pageKind}`);
        if (page.noteId && (page.pageKind === 'detail-text' || page.pageKind === 'detail-image')) {
          await rebuildToTextFallback(page.noteId);
        }
        return;
      }

      if (page.imageUpdate) {
        let imageSent = false;
        let finalImageResult: unknown = null;

        for (const attempt of page.imageUpdate.attempts) {
          const imageResult = await state.bridge.updateImageRawData(new ImageRawDataUpdate({
            containerID: page.imageUpdate.containerID,
            containerName: page.imageUpdate.containerName,
            imageData: attempt.imageData
          }));

          finalImageResult = imageResult;

          if (isImageUpdateSuccess(imageResult)) {
            if (attempt.label !== page.imageUpdate.attempts[0]?.label) {
              pushLog(`Image update fallback worked (${attempt.label})`);
            }
            imageSent = true;
            break;
          }
        }

        if (!imageSent) {
          pushLog(`Image update failed (${String(finalImageResult)})`);
          if (page.noteId) {
            await rebuildToTextFallback(page.noteId);
          }
          return;
        }
      }
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      pushLog(`Bridge sync error: ${message}`);
    });
}
