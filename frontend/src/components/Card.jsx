import React from 'react';
import PropTypes from 'prop-types';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white shadow-md rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}
Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

CardContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};
