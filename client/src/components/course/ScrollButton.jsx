import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ScrollButton = ({ direction, onClick, isVisible }) => (
  <button
    onClick={onClick}
    className={`btn btn-light shadow rounded-circle position-absolute top-50 translate-middle-y scroll-button-hover ${
      direction === 'left' ? 'start-0 ms-2' : 'end-0 me-2'
    }`}
    style={{
      display: isVisible ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      width: '3.5rem',
      height: '3.5rem',
    }}
  >
    {direction === 'left' ? (
      <ChevronLeft size={28} />
    ) : (
      <ChevronRight size={28} />
    )}
  </button>
);

export default ScrollButton;
