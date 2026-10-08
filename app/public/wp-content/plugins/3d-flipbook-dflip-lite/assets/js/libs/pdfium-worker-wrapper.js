// PDFium Worker Implementation
let pdfium = void 0;

const calculateMD5 = (function calculateMD5Closure() {
  const r = new Uint8Array([
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ]);

  const k = new Int32Array([
    -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426,
    -1473231341, -45705983, 1770035416, -1958414417, -42063, -1990404162,
    1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632,
    643717713, -373897302, -701558691, 38016083, -660478335, -405537848,
    568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784,
    1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556,
    -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222,
    -722521979, 76029189, -640364487, -421815835, 530742520, -995338651,
    -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606,
    -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649,
    -145523070, -1120210379, 718787259, -343485551,
  ]);

  function hash(data, offset, length) {
    let h0 = 1732584193,
      h1 = -271733879,
      h2 = -1732584194,
      h3 = 271733878;
    // pre-processing
    const paddedLength = (length + 72) & ~63; // data + 9 extra bytes
    const padded = new Uint8Array(paddedLength);
    let i, j;
    for (i = 0; i < length; ++i) {
      padded[i] = data[offset++];
    }
    padded[i++] = 0x80;
    const n = paddedLength - 8;
    while (i < n) {
      padded[i++] = 0;
    }
    padded[i++] = (length << 3) & 0xff;
    padded[i++] = (length >> 5) & 0xff;
    padded[i++] = (length >> 13) & 0xff;
    padded[i++] = (length >> 21) & 0xff;
    padded[i++] = (length >>> 29) & 0xff;
    padded[i++] = 0;
    padded[i++] = 0;
    padded[i++] = 0;
    const w = new Int32Array(16);
    for (i = 0; i < paddedLength;) {
      for (j = 0; j < 16; ++j, i += 4) {
        w[j] =
          padded[i] |
          (padded[i + 1] << 8) |
          (padded[i + 2] << 16) |
          (padded[i + 3] << 24);
      }
      let a = h0,
        b = h1,
        c = h2,
        d = h3,
        f,
        g;
      for (j = 0; j < 64; ++j) {
        if (j < 16) {
          f = (b & c) | (~b & d);
          g = j;
        } else if (j < 32) {
          f = (d & b) | (~d & c);
          g = (5 * j + 1) & 15;
        } else if (j < 48) {
          f = b ^ c ^ d;
          g = (3 * j + 5) & 15;
        } else {
          f = c ^ (b | ~d);
          g = (7 * j) & 15;
        }
        const tmp = d,
          rotateArg = (a + f + k[j] + w[g]) | 0,
          rotate = r[j];
        d = c;
        c = b;
        b = (b + ((rotateArg << rotate) | (rotateArg >>> (32 - rotate)))) | 0;
        a = tmp;
      }
      h0 = (h0 + a) | 0;
      h1 = (h1 + b) | 0;
      h2 = (h2 + c) | 0;
      h3 = (h3 + d) | 0;
    }
    // prettier-ignore
    return new Uint8Array([
      h0 & 0xFF, (h0 >> 8) & 0xFF, (h0 >> 16) & 0xFF, (h0 >>> 24) & 0xFF,
      h1 & 0xFF, (h1 >> 8) & 0xFF, (h1 >> 16) & 0xFF, (h1 >>> 24) & 0xFF,
      h2 & 0xFF, (h2 >> 8) & 0xFF, (h2 >> 16) & 0xFF, (h2 >>> 24) & 0xFF,
      h3 & 0xFF, (h3 >> 8) & 0xFF, (h3 >> 16) & 0xFF, (h3 >>> 24) & 0xFF
    ]);
  }

  return hash;
})();

// Handle messages from the main thread
self.onmessage = async function (event) {
  const data = event.data;

  try {
    switch (data.cmd) {
      case 'init':
        await initializePdfium(data.pdfiumWasmUrl, data.pdfiumWasmResponse);
        self.postMessage({ cmd: 'init', success: true, requestId: data.requestId });
        break;

      case 'loadDocument':
        const docResult = await loadDocument(data.fileData);
        self.postMessage({
          cmd: 'loadDocument',
          success: true,
          numPages: docResult.numPages,
          docId: docResult.docId,
          fileHash: docResult.fileHash,
          requestId: data.requestId
        });
        break;

      case 'getOutline':
        const outlineResult = await getOutline(data.docId);
        self.postMessage({
          cmd: 'getOutline',
          success: true,
          outline: outlineResult,
          requestId: data.requestId
        });
        break;

      case 'getPage':
        const pageInfo = await getPage(data.docId, data.pageNumber);
        self.postMessage({
          cmd: 'getPage',
          success: true,
          pageNumber: data.pageNumber,
          width: pageInfo.width,
          height: pageInfo.height,
          pageId: pageInfo.pageId,
          requestId: data.requestId,
          viewBox: pageInfo.viewBox
        });
        break;

      case 'getAnnotations':
        const annotationsResult = await getAnnotations(data.docId, data.pageId);
        self.postMessage({
          cmd: 'getAnnotations',
          success: true,
          annotations: annotationsResult,
          requestId: data.requestId
        });
        break;

      case 'getTextContent':
        // const textContentResult = await getTextContent(data.docId, data.pageId);
        self.postMessage({
          cmd: 'getTextContent',
          success: true,
          textContent: {items:[]},//annotationsResult,
          requestId: data.requestId
        });
        break;

      case 'renderPage':
        const renderResult = await renderPage(
          data.pageId,
          data.width,
          data.height
        );
        self.postMessage({
          cmd: 'renderPage',
          success: true,
          pageNumber: data.pageNumber,
          imageData: renderResult.imageData,
          requestId: data.requestId
        }, [renderResult.imageData.data.buffer]);
        break;

      case 'closePage':
        closePage(data.pageId);
        self.postMessage({
          cmd: 'closePage', success: true,
          requestId: data.requestId
        });
        break;

      case 'closeDocument':
        closeDocument(data.docId);
        self.postMessage({
          cmd: 'closeDocument', success: true,
          requestId: data.requestId
        });
        break;

      default:
        throw new Error(`Unknown command: ${data.cmd}`);
    }
  } catch (error) {
    self.postMessage({
      cmd: data.cmd,
      success: false,
      error: error.message
    });
  }
};

// Store loaded documents and pages
const documents = new Map();
const pages = new Map();
let nextDocId = 1;
let nextPageId = 1;

// Initialize PDFium
async function initializePdfium(pdfiumWasmUrl, pdfiumWasmResponse) {
  if (pdfium) return pdfium;

  let _pdfiumInstance;
  if(pdfiumWasmResponse) {
    _pdfiumInstance = await self.PDFiumJSInstance({wasmBinary:pdfiumWasmResponse});
  }else{
    const response = await fetch(pdfiumWasmUrl);
    const wasmBinary = await response.arrayBuffer();
    _pdfiumInstance = await self.PDFiumJSInstance({ wasmBinary:wasmBinary })
  }
  // Initialize the PDFium extension library
  _pdfiumInstance.PDFiumExt_Init();

  pdfium = _pdfiumInstance;
  return pdfium;
}

// Load a document
async function loadDocument(fileData) {
  if (!pdfium) {
    throw new Error('PDFium not initialized');
  }

  const docId = nextDocId++;

  // Convert fileData to Uint8Array if it's not already
  const uint8Data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);

  // Allocate memory for the file data
  const filePtr = pdfium.pdfium.wasmExports.malloc(uint8Data.length);
  pdfium.pdfium.HEAPU8.set(uint8Data, filePtr);

  // Load the document
  const docPtr = pdfium.FPDF_LoadMemDocument(filePtr, uint8Data.length, 0);

  if (!docPtr) {
    const error = pdfium.FPDF_GetLastError();
    pdfium.pdfium.wasmExports.free(filePtr);
    throw new Error(`Failed to load PDF: ${error}`);
  }

  // Get the page count
  const pageCount = pdfium.FPDF_GetPageCount(docPtr);

  // Get first 1024 bytes (or less if file is smaller)
  const bytesToHash = Math.min(1024, uint8Data.length);
  const firstBytes = uint8Data.slice(0, bytesToHash);

  // Calculate MD5 hash
  const hashBytes = calculateMD5(firstBytes, 0, bytesToHash);

  // Convert to hex string
  const hashHex = Array.from(hashBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Store the document info
  documents.set(docId, {
    docPtr,
    filePtr,
    numPages: pageCount,
    fileHash: hashHex
  });

  return {
    docId,
    numPages: pageCount,
    fileHash: hashHex
  };
}

// Function to extract bookmarks from PDFium
function getBookmarksFromPDFium(docPtr) {
  const bookmarks = [];

  // Get the first bookmark (root)
  let bookmark = pdfium.FPDFBookmark_GetFirstChild(docPtr, null);

  function processBookmark(currentBookmark) {
    if (!currentBookmark) return null;

    // First, get the required buffer size by calling with null buffer
    const requiredLength = pdfium.FPDFBookmark_GetTitle(
      currentBookmark,
      null, 0
    );

    let title = "";
    if (requiredLength > 0) {
      // Allocate memory for the exact size needed
      const titleBufferPtr = pdfium.pdfium.wasmExports.malloc(requiredLength);

      try {
        // Get the actual title
        const actualLength = pdfium.FPDFBookmark_GetTitle(
          currentBookmark,
          titleBufferPtr,
          requiredLength
        );

        if (actualLength > 0) {
          // Extract string from PDFium's memory heap
          const heapU8 = pdfium.pdfium.HEAPU8;

          // Create a view of the memory with the actual length
          const stringBytes = new Uint8Array(
            heapU8.buffer,
            heapU8.byteOffset + titleBufferPtr,
            actualLength
          );

          // Decode as UTF-8
          const decoder = new TextDecoder('utf-8');
          title = decoder.decode(stringBytes);
          // Remove any remaining null characters
          title = title.replace(/\u0000/g, '');
        }
      } finally {
        // IMPORTANT: Free the allocated memory
        pdfium.pdfium.wasmExports.free(titleBufferPtr);
      }
    }
    // Get bookmark destination
    const dest = pdfium.FPDFBookmark_GetDest(docPtr, currentBookmark);
    let pageNumber = null;

    if (dest) {
      // Get destination page index
      pageNumber = pdfium.FPDFDest_GetDestPageIndex(docPtr, dest) + 1; // +1 for 1-based indexing
    }

    // Create bookmark object
    const bookmarkObj = {
      title: title,
      dest: pageNumber,
      custom: true,
      items: []
    };

    // Process child bookmarks recursively
    let childBookmark = pdfium.FPDFBookmark_GetFirstChild(docPtr, currentBookmark);
    while (childBookmark) {
      const child = processBookmark(childBookmark);
      if (child) {
        bookmarkObj.items.push(child);
      }
      childBookmark = pdfium.FPDFBookmark_GetNextSibling(docPtr, childBookmark);
    }

    return bookmarkObj;
  }

  // Process all bookmarks
  while (bookmark) {
    const bookmarkObj = processBookmark(bookmark);
    if (bookmarkObj) {
      bookmarks.push(bookmarkObj);
    }
    bookmark = pdfium.FPDFBookmark_GetNextSibling(docPtr, bookmark);
  }

  return bookmarks;
}

async function getOutline(docId) {
  if (!pdfium) {
    throw new Error('PDFium not initialized');
  }

  const doc = documents.get(docId);
  if (!doc) {
    throw new Error(`Document not found: ${docId}`);
  }

  const outline = getBookmarksFromPDFium(doc.docPtr);
  return outline;
}

// Get a page
async function getPage(docId, pageNumber) {
  if (!pdfium) {
    throw new Error('PDFium not initialized');
  }

  const doc = documents.get(docId);
  if (!doc) {
    throw new Error(`Document not found: ${docId}`);
  }

  const pageId = nextPageId++;

  // Load the page
  const pagePtr = pdfium.FPDF_LoadPage(doc.docPtr, pageNumber - 1);
  if (!pagePtr) {
    throw new Error(`Failed to load page ${pageNumber}`);
  }

  // Get page dimensions
  const width = pdfium.FPDF_GetPageWidthF(pagePtr);
  const height = pdfium.FPDF_GetPageHeightF(pagePtr);
  const rotation = pdfium.FPDFPage_GetRotation(pagePtr);
  const pageDetails = getPageDetails(pagePtr, pdfium);
  // Store the page info
  pages.set(pageId, {
    pagePtr,
    docId,
    pageNumber,
    width,
    height,
    rotation : rotation,
    viewBox: pageDetails.viewBox
  });

  return {
    pageId,
    width,
    height,
    rotation : rotation,
    viewBox: pageDetails.viewBox
  };
}

// Render a page
async function renderPage(pageId, width, height) {
  if (!pdfium) {
    throw new Error('PDFium not initialized');
  }

  const page = pages.get(pageId);
  if (!page) {
    throw new Error(`Page not found: ${pageId}`);
  }

  // Create a bitmap for rendering
  const bitmapPtr = pdfium.FPDFBitmap_Create(width, height, 0);
  pdfium.FPDFBitmap_FillRect(bitmapPtr, 0, 0, width, height, 0xFFFFFFFF);

  // Render the page to the bitmap
  pdfium.FPDF_RenderPageBitmap(
    bitmapPtr,
    page.pagePtr,
    0,
    0,
    width,
    height,
    0, // rotateFlag
    16 // Use FPDF_REVERSE_BYTE_ORDER flag for correct color representation
  );

  // Get the bitmap buffer
  const bufferPtr = pdfium.FPDFBitmap_GetBuffer(bitmapPtr);
  if (!bufferPtr) {
    pdfium.FPDFBitmap_Destroy(bitmapPtr);
    throw new Error('Failed to get bitmap buffer');
  }

  const bufferSize = width * height * 4; // RGBA

  // Create a COPY of the buffer data to prevent memory issues
  const buffer = new Uint8Array(
    pdfium.pdfium.HEAPU8.buffer,
    pdfium.pdfium.HEAPU8.byteOffset + bufferPtr,
    bufferSize
  ).slice();

  // Create ImageData from the buffer copy
  const imageData = new ImageData(
    new Uint8ClampedArray(buffer.buffer),
    width,
    height
  );

  // Clean up bitmap
  pdfium.FPDFBitmap_Destroy(bitmapPtr);

  return {
    imageData
  };
}

function getAnnotations(docId, pageId) {
  if (!pdfium) {
    throw new Error('PDFium not initialized');
  }

  const doc = documents.get(docId);
  if (!doc) {
    throw new Error(`Document not found: ${docId}`);
  }

  const page = pages.get(pageId);
  if (!page) {
    throw new Error(`Page not found: ${pageId}`);
  }

  const annotationsCount = pdfium.FPDFPage_GetAnnotCount(page.pagePtr);
  const annotationsArray = [];

  // Annotation subtype constants (based on PDFium documentation)
  // #define FPDF_ANNOT_UNKNOWN 0
  // #define FPDF_ANNOT_TEXT 1
  // #define FPDF_ANNOT_LINK 2
  // #define FPDF_ANNOT_FREETEXT 3
  // #define FPDF_ANNOT_LINE 4
  // #define FPDF_ANNOT_SQUARE 5
  // #define FPDF_ANNOT_CIRCLE 6
  // #define FPDF_ANNOT_POLYGON 7
  // #define FPDF_ANNOT_POLYLINE 8
  // #define FPDF_ANNOT_HIGHLIGHT 9
  // #define FPDF_ANNOT_UNDERLINE 10
  // #define FPDF_ANNOT_SQUIGGLY 11
  // #define FPDF_ANNOT_STRIKEOUT 12
  // #define FPDF_ANNOT_STAMP 13
  // #define FPDF_ANNOT_CARET 14
  // #define FPDF_ANNOT_INK 15
  // #define FPDF_ANNOT_POPUP 16
  // #define FPDF_ANNOT_FILEATTACHMENT 17
  // #define FPDF_ANNOT_SOUND 18
  // #define FPDF_ANNOT_MOVIE 19
  // #define FPDF_ANNOT_WIDGET 20
  // #define FPDF_ANNOT_SCREEN 21
  // #define FPDF_ANNOT_PRINTERMARK 22
  // #define FPDF_ANNOT_TRAPNET 23
  // #define FPDF_ANNOT_WATERMARK 24
  // #define FPDF_ANNOT_THREED 25
  // #define FPDF_ANNOT_RICHMEDIA 26
  // #define FPDF_ANNOT_XFAWIDGET 27
  // #define FPDF_ANNOT_REDACT 28
  const FPDF_ANNOT_LINK = 2;
  // console.log("Page number: " + page.pageNumber);
  getPageDetails(page.pagePtr, pdfium);
  if (annotationsCount > 0) {




    for (let i = 0; i < annotationsCount; i++) {
      const annotationPtr = pdfium.FPDFPage_GetAnnot(page.pagePtr, i);

      if (!annotationPtr) {
        console.warn(`Failed to get annotation at index ${i}`);
        continue;
      } else {
        // console.log("Annotation found at page " + page.pageNumber + " at index " + i);
      }

      try {
        // Get annotation subtype
        const subtype = pdfium.FPDFAnnot_GetSubtype(annotationPtr);
        // console.log("Annotation subtype: " + subtype);
        // Only process link annotations for now
        if (subtype === FPDF_ANNOT_LINK) {
          const annotationData = extractLinkAnnotationData(annotationPtr, pdfium, doc.docPtr);
          // console.log("Annotation Original", annotationData.rect);
          annotationData.rect = PDFToViewerCoordinates(annotationData.rect, page, pdfium);
          // console.log("Annotation Corrected", annotationData.rect);
          annotationsArray.push(annotationData);
        } else {
          console.warn("Annotation subtype: " + subtype + " not supported" + " on page: " + page.pageNumber);
        }

        // Close the annotation to free memory
        pdfium.FPDFPage_CloseAnnot(annotationPtr);

      } catch (error) {
        console.error(`Error processing annotation at index ${i}:`, error);
        // Make sure to close the annotation even if there's an error
        try {
          pdfium.FPDFPage_CloseAnnot(annotationPtr);
        } catch (closeError) {
          console.error('Error closing annotation:', closeError);
        }
      }
    }

  }
  return annotationsArray;
}

function PDFToViewerCoordinates(rect, page, pdfium) {
  // rect = {pdf_x1:0,pdf_y1:page.height,pdf_x2:page.width,pdf_y2:0};
  // console.log("Before Rect",rect);
  let new_rect = {};
  let device_x1 = pdfium.pdfium.wasmExports.malloc(4),
    device_y1 = pdfium.pdfium.wasmExports.malloc(4),
    device_x2 = pdfium.pdfium.wasmExports.malloc(4),
    device_y2 = pdfium.pdfium.wasmExports.malloc(4);
  try {
    pdfium.FPDF_PageToDevice(page.pagePtr,
      0, 0,                    // start_x, start_y (viewport origin)
      page.width,           // size_x (display width)
      page.height,          // size_y (display height)
      page.rotation, // rotation
      rect.pdf_x1, rect.pdf_y1,           // page coordinates
      device_x1, device_y1);  // output device coordinates

    pdfium.FPDF_PageToDevice(page.pagePtr,
      0, 0,                    // start_x, start_y (viewport origin)
      page.width,           // size_x (display width)
      page.height,          // size_y (display height)
      page.rotation, // rotation
      rect.pdf_x2, rect.pdf_y2,           // page coordinates
      device_x2, device_y2);  // output device coordinates

    new_rect.dev_x1 = pdfium.pdfium.getValue(device_x1, 'i16');
    new_rect.dev_y1 = pdfium.pdfium.getValue(device_y1, 'i16');
    new_rect.dev_x2 = pdfium.pdfium.getValue(device_x2, 'i16');
    new_rect.dev_y2 = pdfium.pdfium.getValue(device_y2, 'i16');

  } finally {
    pdfium.pdfium.wasmExports.free(device_x1);
    pdfium.pdfium.wasmExports.free(device_y1);
    pdfium.pdfium.wasmExports.free(device_x2);
    pdfium.pdfium.wasmExports.free(device_y2);
  }

  return new_rect;
}

function getPageDetails(pagePtr, pdfium) {
  let rect = {};
  const leftPtr = pdfium.pdfium.wasmExports.malloc(4);
  const bottomPtr = pdfium.pdfium.wasmExports.malloc(4);
  const rightPtr = pdfium.pdfium.wasmExports.malloc(4);
  const topPtr = pdfium.pdfium.wasmExports.malloc(4);
  try {
    let result = pdfium.FPDFPage_GetCropBox(pagePtr, leftPtr, bottomPtr, rightPtr, topPtr);
    if (!result) {
      result = pdfium.FPDFPage_GetMediaBox(pagePtr, leftPtr, bottomPtr, rightPtr, topPtr);
    }
    if (result) {
      rect.left = pdfium.pdfium.getValue(leftPtr, 'float');
      rect.bottom = pdfium.pdfium.getValue(bottomPtr, 'float');
      rect.right = pdfium.pdfium.getValue(rightPtr, 'float');
      rect.top = pdfium.pdfium.getValue(topPtr, 'float');
    }
  } catch (error) {
    console.error('Error getting media box:', error);
  } finally {
    // Free the allocated memory
    pdfium.pdfium.wasmExports.free(leftPtr);
    pdfium.pdfium.wasmExports.free(bottomPtr);
    pdfium.pdfium.wasmExports.free(rightPtr);
    pdfium.pdfium.wasmExports.free(topPtr);
  }
  return { viewBox: rect };
}

/**
 * Extract detailed data from a link annotation
 * @param {number} annotationPtr - The PDFium annotation pointer
 * @param {Object} pdfium - The PDFium instance
 * @returns {Object} - Detailed annotation data
 */
function extractLinkAnnotationData(annotationPtr, pdfium, docPtr) {
  const annotationData = {
    type: 'Link',
    subtype: 'Link',
    index: null,
    properties: {},
    rect: { pdf_x1: 0, pdf_y1: 0, pdf_x2: 0, pdf_y2: 0 }
  };



  // Allocate memory for rectangle structure (4 floats = 16 bytes)
  const rectPtr = pdfium.pdfium.wasmExports.malloc(16);
  try {
    const result = pdfium.FPDFAnnot_GetRect(annotationPtr, rectPtr);
    if (result) {
      const left = pdfium.pdfium.getValue(rectPtr, 'float');
      const bottom = pdfium.pdfium.getValue(rectPtr + 4, 'float');
      const right = pdfium.pdfium.getValue(rectPtr + 8, 'float');
      const top = pdfium.pdfium.getValue(rectPtr + 12, 'float');
      annotationData.rect = {
        pdf_x1: left,
        pdf_y1: bottom,
        pdf_x2: right,
        pdf_y2: top
      };
    }
  } finally {
    // Free the allocated memory
    pdfium.pdfium.wasmExports.free(rectPtr);
  }

  // Get link-specific properties
  const linkPtr = pdfium.FPDFAnnot_GetLink(annotationPtr);
  if (linkPtr) {
    // Get URI action

    //FPDFLink_GetDest
    // NULL if there is no destination associated with the link, in this case
    // the application should try FPDFLink_GetAction.
    let linkDestPtr = pdfium.FPDFLink_GetDest(docPtr, linkPtr); //this is a pointer to the destination

    if (linkDestPtr) {
      //if there is a destination, we get the destination page index
      const pageIndex = pdfium.FPDFDest_GetDestPageIndex(docPtr, linkDestPtr);
      if (pageIndex >= 0) {
        // Convert to 1-based page number
        const pageNumber = pageIndex + 1;
        annotationData.properties.dest = {
          type: 'goto',
          pageNumber: pageNumber
        };
      }

    } else {
      //if there is no destination, we try to get the action
      let actionPtr = pdfium.FPDFLink_GetAction(linkPtr); //this is a pointer to the action
      if (actionPtr) {


        // #define PDFACTION_UNSUPPORTED		0		// Unsupported action type
        // #define PDFACTION_GOTO				    1		// Go to a destination within current document
        // #define PDFACTION_REMOTEGOTO		  2		// Go to a destination within another document
        // #define PDFACTION_URI				    3		// Universal Resource Identifier
        // #define PDFACTION_LAUNCH			    4		// Launch an application or open a file

        const actionType = pdfium.FPDFAction_GetType(actionPtr);
        // console.log("Action type: " + actionType);
        if (actionType === 3) {
          const uriLength = pdfium.FPDFAction_GetURIPath(docPtr, actionPtr, null, 0);
          if (uriLength > 0) {
            const uriBufferPtr = pdfium.pdfium.wasmExports.malloc(uriLength);
            const actualLength = pdfium.FPDFAction_GetURIPath(
              docPtr,
              actionPtr,
              uriBufferPtr,
              uriLength
            );
            if (actualLength > 0) {
              // annotationData.properties.uri = new TextDecoder().decode(uriBuffer);
              // Extract string from PDFium's memory heap
              const heapU8 = pdfium.pdfium.HEAPU8;

              // Create a view of the memory with the actual length
              const stringBytes = new Uint8Array(
                heapU8.buffer,
                heapU8.byteOffset + uriBufferPtr,
                actualLength
              );

              // Decode as UTF-8
              const decoder = new TextDecoder('utf-8');
              annotationData.properties.uri = decoder.decode(stringBytes);
              // console.log("URI: " + annotationData.properties.uri);
            }

            pdfium.pdfium.wasmExports.free(uriBufferPtr);
          }
        } else if (actionType === 1) {
          // console.log("Action type: " + actionType + " Destination ");
          const destPtr = pdfium.FPDFAction_GetDest(docPtr, actionPtr);
          if (destPtr) {
            // Get destination page index (0-based)
            const pageIndex = pdfium.FPDFDest_GetDestPageIndex(docPtr, destPtr);
            if (pageIndex >= 0) {
              // Convert to 1-based page number
              const pageNumber = pageIndex + 1;
              annotationData.properties.dest = {
                type: 'goto',
                pageNumber: pageNumber
              };
              // console.log("Destination page: " + pageNumber + " for Action type: " + actionType);
            }
          } else {
            console.warn("Destination not found for Action type: " + actionType);
          }
        }
      } else {
        console.warn("Action not found for Link annotation on page ");
      }
    }
  }

  return annotationData;
}

// Close a page
function closePage(pageId) {
  if (!pdfium) {
    throw new Error('PDFium not initialized');
  }

  const page = pages.get(pageId);
  if (!page) {
    throw new Error(`Page not found: ${pageId}`);
  }

  pdfium.FPDF_ClosePage(page.pagePtr);
  pages.delete(pageId);
}

// Close a document
function closeDocument(docId) {
  if (!pdfium) {
    throw new Error('PDFium not initialized');
  }

  const doc = documents.get(docId);
  if (!doc) {
    throw new Error(`Document not found: ${docId}`);
  }

  // Close all pages associated with this document
  for (const [pageId, page] of pages.entries()) {
    if (page.docId === docId) {
      pdfium.FPDF_ClosePage(page.pagePtr);
      pages.delete(pageId);
    }
  }

  pdfium.FPDF_CloseDocument(doc.docPtr);
  pdfium.pdfium.wasmExports.free(doc.filePtr);
  documents.delete(docId);
}
