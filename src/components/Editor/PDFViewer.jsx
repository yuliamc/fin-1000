import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button, Spinner, Form } from 'react-bootstrap';

import usePageNavigation from './UsePagePagination';
import useVerticalLines from './UseVerticalLines';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

function PDFViewer({ file }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const renderTaskRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    verticalLines, addVerticalLine, removeLastLine,
    handleMouseDown,
    drawVerticalLines, isDragging,
  } = useVerticalLines({ canvasRef });

  const {
    currentPage, pageInput, totalPages,
    handlePrevPage, handleNextPage, handleTotalPages,
    handlePageInputChange, handlePageInputBlur, handlePageInputKeyUp,
  } = usePageNavigation();

  const pageRendering = useRef(false);
  const pageNumPending = useRef(null);
  const drawPage = async (pageNum, doc) => {
    if (!doc) return;

    if (pageRendering.current) {
      pageNumPending.current = pageNum;
      return;
    }

    if (renderTaskRef.current) {
      await renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    // Sets flags.
    pageRendering.current = true;
    setIsLoading(true);

    // Page and viewport.
    const page = await doc.getPage(pageNum);
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 2;
    const originalViewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / originalViewport.width;
    const viewport = page.getViewport({ scale });

    // Canvas.
    const canvas = canvasRef.current;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Context.
    const context = canvas.getContext('2d');
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    try {
      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      drawVerticalLines();
    } catch (error) {
      console.error('Error Rendering PDF:', error);
    } finally {
      // Unsets flags.
      pageRendering.current = false;
      if (pageNumPending.current !== null) {
        renderPage(pageNumPending.current);
        pageNumPending.current = null;
      }

      setIsLoading(false);
    }
  };

  const renderPage = async (pageNum, doc = pdfDoc) => {
    await drawPage(pageNum, doc)
    drawVerticalLines()
  };

  const queueRenderPage = (num) => {
    if (pageRendering.current) {
      pageNumPending.current = num;
    } else {
      renderPage(num);
    }
  }

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      setIsLoading(true);
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        setPdfDoc(pdf);
        handleTotalPages(pdf.numPages);
        queueRenderPage(1, pdf);
      };
      fileReader.readAsArrayBuffer(file);
    };

    loadPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (pdfDoc) {
      queueRenderPage(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, verticalLines, currentPage]);

  return (
    <div ref={containerRef} className="pdf-viewer">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <Button
            variant="primary"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            className="me-2"
          >
            Previous
          </Button>
          <Form.Control
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyUp={handlePageInputKeyUp}
            style={{ width: '60px' }}
            className="text-center mx-2"
            disabled={isLoading}
          />
          <Button
            variant="primary"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div>
          <Button
            variant="success"
            onClick={addVerticalLine}
            className="me-2"
            disabled={isLoading}
          >
            Add Line
          </Button>
          <Button
            variant="danger"
            onClick={removeLastLine}
            disabled={verticalLines.length === 0 || isLoading}
          >
            Remove Last Line
          </Button>
        </div>
      </div>
      <div style={{ position: 'relative', border: '1px solid #ddd' }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1
            }}
          >
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          style={{
            width: '100%',
            height: 'auto',
            cursor: isDragging ? 'col-resize' : 'default',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        />
      </div>
    </div>
  );
}

export default PDFViewer;