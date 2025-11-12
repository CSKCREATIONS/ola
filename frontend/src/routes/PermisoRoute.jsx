// components/PermisoRoute.jsx
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

export default function PermisoRoute({ permiso, children }) {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || !user.permissions || !user.permissions.includes(permiso)) {
    return <Navigate to="/Home" />; // redirige si no tiene permiso
  }

  return children; // renderiza normalmente si tiene el permiso
}

PermisoRoute.propTypes = {
  permiso: PropTypes.string.isRequired,
  children: PropTypes.node,
};
