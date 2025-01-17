import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button, Spinner, Form } from 'react-bootstrap';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

function PDFViewer({ file }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [totalPages, setTotalPages] = useState(0);
  const [verticalLines, setVerticalLines] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLineIndex, setDragLineIndex] = useState(null);
  const renderTaskRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      setIsLoading(true);
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        renderPage(1, pdf);
      };
      fileReader.readAsArrayBuffer(file);
    };

    loadPDF();
  }, [file]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [verticalLines, currentPage]);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const renderPage = async (pageNum, doc = pdfDoc) => {
    if (!doc) return;
    setIsLoading(true);

    if (renderTaskRef.current) {
      await renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const page = await doc.getPage(pageNum);
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const context = canvas.getContext('2d');

    const containerWidth = container.clientWidth - 2;
    const originalViewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / originalViewport.width;
    const viewport = page.getViewport({ scale });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    try {
      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      drawVerticalLines();
      setIsLoading(false);
    } catch (error) {
      if (error.message !== 'Rendering cancelled') {
        console.error('Error rendering PDF:', error);
      }
      setIsLoading(false);
    }
  };

  const drawVerticalLines = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    verticalLines.forEach((x, index) => {
      // Draw the line
      context.beginPath();
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();

      // Draw the line number
      context.save();
      context.fillStyle = 'white';
      context.strokeStyle = 'red';
      context.lineWidth = 1;
      context.font = '14px Arial';
      const text = index.toString();
      const textWidth = context.measureText(text).width;
      const padding = 4;
      const boxWidth = textWidth + (padding * 2);
      const boxHeight = 20;
      
      // Draw background box
      context.fillStyle = 'red';
      context.fillRect(x - (boxWidth / 2), 0, boxWidth, boxHeight);
      
      // Draw text
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, x, boxHeight / 2);
      context.restore();
    });
  };

  const addVerticalLine = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const newX = canvas.width / 2;
    setVerticalLines(prev => [...prev, newX]);
  };

  const removeLastLine = () => {
    if (verticalLines.length === 0) return;
    setVerticalLines(prev => prev.slice(0, -1));
  };

  const getMousePosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    return (e.clientX - rect.left) * scaleX;
  };

  const handleMouseDown = (e) => {
    const x = getMousePosition(e);
    const lineIndex = verticalLines.findIndex(lineX => 
      Math.abs(lineX - x) < 20
    );

    if (lineIndex !== -1) {
      setIsDragging(true);
      setDragLineIndex(lineIndex);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || dragLineIndex === null) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;

    setVerticalLines(prev => {
      const newLines = [...prev];
      newLines[dragLineIndex] = Math.max(0, Math.min(x, canvas.width));
      return newLines;
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragLineIndex(null);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageInputBlur = () => {
    let newPage = parseInt(pageInput, 10);
    if (isNaN(newPage) || newPage < 1) {
      newPage = 1;
    } else if (newPage > totalPages) {
      newPage = totalPages;
    }
    setPageInput(newPage.toString());
    setCurrentPage(newPage);
  };

  const handlePageInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div ref={containerRef} className="pdf-viewer">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <Button 
            variant="primary" 
            onClick={prevPage} 
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
            onKeyPress={handlePageInputKeyPress}
            style={{ width: '60px' }}
            className="text-center mx-2"
            disabled={isLoading}
          />
          <Button 
            variant="primary" 
            onClick={nextPage} 
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