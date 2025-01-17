import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import PDFViewer from './PDFViewer';

function Editor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setShowPDF(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setShowPDF(false);
    // Reset the file input by clearing its value
    const fileInput = document.getElementById('pdfFile');
    if (fileInput) fileInput.value = '';
  };

  const handleOpen = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    setShowPDF(true);
    setIsLoading(false);
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="bg-light p-4">
            <Row className="align-items-center">
              <Col>
                <Form.Control
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  id="pdfFile"
                />
              </Col>
              <Col xs="auto">
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  disabled={!selectedFile || isLoading}
                  className="me-2"
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  onClick={handleOpen}
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Loading...
                    </>
                  ) : (
                    'Open'
                  )}
                </Button>
              </Col>
            </Row>
          </div>
          {showPDF && selectedFile && (
            <div className="mt-4">
              <PDFViewer file={selectedFile} />
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Editor;