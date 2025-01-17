import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';

function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <Container className="py-2">
      <div className="d-flex align-items-center text-muted small">
        <Link to="/" className="text-decoration-none text-muted">Home</Link>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          return (
            <React.Fragment key={name}>
              <span className="mx-2">/</span>
              {isLast ? (
                <span className="text-dark">{name}</span>
              ) : (
                <Link to={routeTo} className="text-decoration-none text-muted">
                  {name}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Container>
  );
}

export default Breadcrumb;