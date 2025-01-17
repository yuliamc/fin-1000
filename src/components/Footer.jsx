import React from 'react';
import { Container } from 'react-bootstrap';

function Footer() {
  return (
    <footer className="bg-light border-top py-3 fixed-bottom">
      <Container className="text-center text-muted">
        <p className="mb-0">© 2024 PDF Web. All rights reserved.</p>
      </Container>
    </footer>
  );
}

export default Footer;