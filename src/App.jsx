import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navigation from './components/Navigation';
import Breadcrumb from './components/Breadcrumb';
import Footer from './components/Footer';
import Editor from './components/Editor';

function App() {
  return (
    <div className="min-vh-100 d-flex flex-column pt-5">
      <Navigation />
      <Breadcrumb />
      <Container as="main" className="flex-grow-1 py-4">
        <Routes>
          <Route path="/editor" element={<Editor />} />
          <Route path="/" element={<Navigate to="/editor" replace />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}

export default App;