// components/PermisoRoute.jsx
import { Navigate } from 'react-router-dom';

export default function PermisoRoute({ permiso, children }) {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || !user.permissions || !user.permissions.includes(permiso)) {
    return <Navigate to="/Home" />; // redirige si no tiene permiso
  }

  return children; // renderiza normalmente si tiene el permiso
}
