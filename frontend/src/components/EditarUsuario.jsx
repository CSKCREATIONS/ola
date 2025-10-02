import React, { useEffect, useState } from 'react';
import { toggleSubMenu, closeModal } from '../funciones/animaciones';
import Swal from 'sweetalert2';


export default function EditarUsuario({ usuario, fetchUsuarios }) {
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [form, setForm] = useState({
    firstName: '',
    secondName: '',
    surname: '',
    secondSurname: '',
    role: '',
    email: '',
    username: '',
    enabled: true,
  });

  const [passwords, setPasswords] = useState({
    new: '',
    confirm: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/roles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      }
    })
      .then(res => res.json())
      .then(data => {
        setRolesDisponibles(data.roles || []);
      })
      .catch(err => {
        console.error('Error al cargar roles:', err);
        setRolesDisponibles([]);
      });

    if (usuario) {
      setForm({
        firstName: usuario.firstName || '',
        secondName: usuario.secondName || '',
        surname: usuario.surname || '',
        secondSurname: usuario.secondSurname || '',
        role: usuario.role?._id || usuario.role || '',
        email: usuario.email || '',
        username: usuario.username || '',
        enabled: usuario.enabled ?? true,
      });
    }

  }, [usuario]);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (passwords.new !== passwords.confirm) {
        return Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
      }

      const res = await fetch(`http://localhost:5000/api/users/${usuario._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Error al actualizar el usuario');

      let nuevaContrasena = null;

      // Cambiar contraseña si aplica
      if (passwords.new && passwords.confirm && passwords.new === passwords.confirm) {
        const resPassword = await fetch(`http://localhost:5000/api/users/${usuario._id}/change-password`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token
          },
          body: JSON.stringify({
            newPassword: passwords.new
          })
        });

        const data = await resPassword.json();
        if (!resPassword.ok) throw new Error(data.message || 'Error al cambiar la contraseña');

        nuevaContrasena = passwords.new;
      }

      await fetchUsuarios();
      closeModal('editUserModal');
      setPasswords({ current: '', new: '', confirm: '' });

      // Actualizar localStorage si el usuario editado es el mismo que está logueado
      const userLogged = JSON.parse(localStorage.getItem('user'));
      if (userLogged && userLogged._id === usuario._id) {
        // Obtener el nombre del rol desde la lista de roles disponibles
        const rolActualizado = rolesDisponibles.find(r => r._id === form.role);

        localStorage.setItem('user', JSON.stringify({
          ...userLogged,
          ...form,
          role: {
            _id: form.role,
            name: rolActualizado ? rolActualizado.name : userLogged.role?.name || ''
          }
        }));

        window.dispatchEvent(new Event('storage')); // para que Fijo.jsx se actualice
      }


      Swal.fire({
        icon: 'success',
        title: 'Usuario actualizado',
        html: nuevaContrasena ? `<p>Contraseña actualizada:<br><b>${nuevaContrasena}</b></p>` : '',
        timer: 2500,
        showConfirmButton: false
      });

    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const modal = document.getElementById('editUserModal');
      const content = modal?.querySelector('.modal-content');

      if (modal && content && !content.contains(e.target) && modal.style.display !== 'none') {
        closeModal('editUserModal');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (


    <form className="modal" id="editUserModal" onSubmit={guardarCambios}>
      <div className="modal-content">
        <div className="form-group">
          <label>Primer nombre</label>
          <input className='entrada' type="text" name="firstName" value={form.firstName} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Segundo nombre</label>
          <input className='entrada' type="text" name="secondName" value={form.secondName} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Primer apellido</label>
          <input className='entrada' type="text" name="surname" value={form.surname} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Segundo apellido</label>
          <input className='entrada' type="text" name="secondSurname" value={form.secondSurname} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Correo electrónico</label>
          <input className='entrada' type="email" name="email" value={form.email} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Nombre de usuario</label>
          <input className='entrada' type="text" name="username" value={form.username} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Rol</label>
          <select className='entrada' name="role" value={form.role} onChange={handleChange} required>
            <option value="" disabled>Seleccione un rol</option>
            {Array.isArray(rolesDisponibles) && rolesDisponibles.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="buttons">
          <button className='btn btn-secondary' onClick={() => toggleSubMenu('changePassword')} type='button'>Cambiar contraseña</button>
        </div>

        <div className='dropdown' id='changePassword' style={{ border: '1px solid #ccc', padding: '0.5rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              className='entrada'
              type="password"
              name="new"
              value={passwords.new}
              onChange={handlePasswordChange}
            />
          </div>
          <div className="form-group">
            <label>Confirmar nueva contraseña</label>
            <input
              className='entrada'
              type="password"
              name="confirm"
              value={passwords.confirm}
              onChange={handlePasswordChange}
            />
          </div>
        </div>


        <div className="buttons">
          <button className="btn btn-secondary" onClick={() => closeModal('editUserModal')} type='button'>Cancelar</button>
          <button className="btn btn-primary" type='submit'>Guardar Cambios</button>
        </div>
      </div>


    </form>
  );
}
