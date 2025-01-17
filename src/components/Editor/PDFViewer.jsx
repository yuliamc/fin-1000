import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from 'react-bootstrap';

// Configure the worker using a relative path
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

function PDFViewer({ file }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [verticalLines, setVerticalLines] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLineIndex, setDragLineIndex] = useState(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
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

  // Re-render when vertical lines change
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [verticalLines, currentPage]);

  const renderPage = async (pageNum, doc = pdfDoc) => {
    if (!doc) return;

    // Cancel any ongoing render operation
    if (renderTaskRef.current) {
      await renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const page = await doc.getPage(pageNum);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const viewport = page.getViewport({ scale: 1.5 });
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
    } catch (error) {
      if (error.message !== 'Rendering cancelled') {
        console.error('Error rendering PDF:', error);
      }
    }
  };

  const drawVerticalLines = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    verticalLines.forEach((x) => {
      context.beginPath();
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
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

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const lineIndex = verticalLines.findIndex(lineX => 
      Math.abs(lineX - x) < 10
    );

    if (lineIndex !== -1) {
      setIsDragging(true);
      setDragLineIndex(lineIndex);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || dragLineIndex === null) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    setVerticalLines(prev => {
      const newLines = [...prev];
      newLines[dragLineIndex] = x;
      return newLines;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragLineIndex(null);
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

  return (
    <div ref={containerRef} className="pdf-viewer">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div>
          <Button 
            variant="primary" 
            onClick={prevPage} 
            disabled={currentPage <= 1}
            className="me-2"
          >
            Previous
          </Button>
          <Button 
            variant="primary" 
            onClick={nextPage} 
            disabled={currentPage >= totalPages}
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
          >
            Add Line
          </Button>
          <Button 
            variant="danger" 
            onClick={removeLastLine}
            disabled={verticalLines.length === 0}
          >
            Remove Last Line
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ border: '1px solid #ddd' }}
      />
    </div>
  );
}

export default PDFViewer;