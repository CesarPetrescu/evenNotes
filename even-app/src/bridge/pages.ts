import {
  CreateStartUpPageContainer,
  ImageContainerProperty,
  ListContainerProperty,
  ListItemContainerProperty,
  RebuildPageContainer,
  TextContainerProperty
} from '@evenrealities/even_hub_sdk';
import type { DiagramImageUpdate, GlassesPage, Note, PageKind } from '../types';
import {
  CONTAINERS,
  GLASSES_BODY_LINES,
  GLASSES_FALLBACK_BODY_LINES,
  GLASSES_FALLBACK_LINE_WIDTH,
  GLASSES_LINE_WIDTH,
  GLASSES_TITLE_LINES,
  MAX_STARTUP_TEXT,
  DIAGRAM_IMAGE_WIDTH,
  DIAGRAM_IMAGE_HEIGHT
} from '../constants';
import { state } from '../state';
import { truncate, singleLine, wrapTextForGlasses } from '../utils/text';
import { listItemLabel, detailDateStamp, detailBodyText, activeDetailNote, pageCount, currentPageNotes } from '../utils/notes';
import { getVisualKind } from '../diagrams/detection';
import { createDiagramImageEncodings } from '../image-encoding/encode-diagram';
import { createAttachmentImageEncodings } from '../image-encoding/encode-attachment';
import { pushLog } from '../render';

function buildDetailTextContent(note: Note, dateStamp: string, compact = false) {
  const lineWidth = compact ? GLASSES_FALLBACK_LINE_WIDTH : GLASSES_LINE_WIDTH;
  const bodyLines = compact ? GLASSES_FALLBACK_BODY_LINES : GLASSES_BODY_LINES;
  const bodyChars = compact ? 220 : 420;
  const meta = wrapTextForGlasses(
    `NOTE ${state.detailNoteIndex + 1}/${state.notes.length}\n${dateStamp}${note.pinned ? ' | PINNED' : ''}`,
    lineWidth,
    2,
    96
  );
  const title = wrapTextForGlasses(singleLine(note.title || 'Untitled'), lineWidth, GLASSES_TITLE_LINES, 96);
  const body = wrapTextForGlasses(detailBodyText(note), lineWidth, bodyLines, bodyChars);
  const controls = compact ? 'CLICK BACK' : 'SCROLL NEXT\nCLICK BACK';

  return truncate(
    [meta, '', title, '', body, '', controls].join('\n'),
    MAX_STARTUP_TEXT
  );
}

export function buildListPage() {
  const notes = currentPageNotes();
  const header = new TextContainerProperty({
    xPosition: 0,
    yPosition: 0,
    width: 576,
    height: 48,
    containerID: CONTAINERS.listHeader,
    containerName: 'listHeader',
    content: `EVEN NOTES\nPAGE ${state.listPage + 1}/${pageCount()} | ${state.notes.length} NOTES`,
    isEventCapture: 0
  });

  const list = new ListContainerProperty({
    xPosition: 0,
    yPosition: 54,
    width: 576,
    height: 234,
    containerID: CONTAINERS.listBody,
    containerName: 'listBody',
    itemContainer: new ListItemContainerProperty({
      itemCount: Math.max(1, notes.length),
      itemWidth: 0,
      isItemSelectBorderEn: 1,
      itemName: notes.length > 0 ? notes.map(listItemLabel) : ['No notes on this page.']
    }),
    isEventCapture: 1
  });

  return {
    containerTotalNum: 2,
    listObject: [list],
    textObject: [header]
  };
}

export function buildEmptyPage() {
  const header = new TextContainerProperty({
    xPosition: 0,
    yPosition: 0,
    width: 576,
    height: 52,
    containerID: CONTAINERS.emptyHeader,
    containerName: 'emptyHeader',
    content: 'EVEN NOTES\nWAITING FOR NOTES',
    isEventCapture: 0
  });

  const body = new TextContainerProperty({
    xPosition: 0,
    yPosition: 60,
    width: 576,
    height: 200,
    containerID: CONTAINERS.emptyBody,
    containerName: 'emptyBody',
    content: 'OPEN THE ADMIN PANEL AND CREATE A NOTE.\nTHE GLASSES VIEW WILL REFRESH OVER WEBSOCKET.',
    isEventCapture: 1
  });

  return {
    containerTotalNum: 2,
    textObject: [header, body]
  };
}

export function buildBootstrapPage() {
  return state.notes.length === 0 ? buildEmptyPage() : buildListPage();
}

export function buildTextDetailPage(note: Note, dateStamp: string, compact = false) {
  return {
    containerTotalNum: 1,
    textObject: [
      new TextContainerProperty({
        xPosition: 0,
        yPosition: 0,
        width: 576,
        height: 288,
        containerID: CONTAINERS.detailBody,
        containerName: 'detailBody',
        content: buildDetailTextContent(note, dateStamp, compact),
        isEventCapture: 1
      })
    ]
  };
}

export async function buildDetailPage() {
  const note = state.notes[state.detailNoteIndex];
  const visualKind = getVisualKind(note);
  const dateStamp = detailDateStamp(note);

  const header = new TextContainerProperty({
    xPosition: 0,
    yPosition: 0,
    width: 576,
    height: 56,
    containerID: CONTAINERS.detailHeader,
    containerName: 'detailHeader',
    content: wrapTextForGlasses(
      `NOTE ${state.detailNoteIndex + 1}/${state.notes.length}\n${dateStamp}${note.pinned ? ' | PINNED' : ''}`,
      GLASSES_FALLBACK_LINE_WIDTH,
      2,
      96
    ),
    isEventCapture: 0
  });

  if (visualKind) {
    try {
      const attempts = visualKind.type === 'diagram'
        ? createDiagramImageEncodings(visualKind.kind)
        : await createAttachmentImageEncodings(visualKind.image);

      const image = new ImageContainerProperty({
        xPosition: 188,
        yPosition: 60,
        width: DIAGRAM_IMAGE_WIDTH,
        height: DIAGRAM_IMAGE_HEIGHT,
        containerID: CONTAINERS.detailImage,
        containerName: 'detailImage'
      });

      const footer = new TextContainerProperty({
        xPosition: 0,
        yPosition: 168,
        width: 576,
        height: 120,
        containerID: CONTAINERS.detailFooter,
        containerName: 'detailFooter',
        content: wrapTextForGlasses(
          `${singleLine(note.title || 'Untitled')}\nSCROLL NEXT\nCLICK BACK`,
          GLASSES_FALLBACK_LINE_WIDTH,
          4,
          120
        ),
        isEventCapture: 1
      });

      return {
        containerTotalNum: 3,
        textObject: [header, footer],
        imageObject: [image],
        imageUpdate: {
          containerID: CONTAINERS.detailImage,
          containerName: 'detailImage',
          attempts
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushLog(`Visual render fallback: ${message}`);
    }
  }

  return buildTextDetailPage(note, dateStamp);
}

export async function buildGlassesPage(): Promise<GlassesPage> {
  const note = activeDetailNote();
  let pageKind: PageKind;
  let pageDefinition;

  if (state.notes.length === 0) {
    pageKind = 'empty';
    pageDefinition = buildEmptyPage();
  } else if (state.view !== 'detail') {
    pageKind = 'list';
    pageDefinition = buildListPage();
  } else {
    pageDefinition = await buildDetailPage();
    pageKind = 'imageUpdate' in pageDefinition ? 'detail-image' : 'detail-text';
  }

  const create = new CreateStartUpPageContainer(pageDefinition);
  const rebuild = new RebuildPageContainer(pageDefinition);

  return {
    pageKind,
    syncLabel: pageKind === 'detail-image' || pageKind === 'detail-text'
      ? `${pageKind} ${state.detailNoteIndex + 1}/${state.notes.length}`
      : pageKind,
    noteId: note?.id,
    create,
    rebuild,
    imageUpdate: 'imageUpdate' in pageDefinition ? (pageDefinition as { imageUpdate: DiagramImageUpdate }).imageUpdate : undefined
  };
}
