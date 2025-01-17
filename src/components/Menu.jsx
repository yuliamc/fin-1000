import React from 'react';
import { Link } from 'react-router-dom';

function Menu() {
  return (
    <nav style={{ padding: '1rem', backgroundColor: '#f0f0f0' }}>
      <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0 }}>
        <li>
          <Link to="/editor">Editor</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Menu;