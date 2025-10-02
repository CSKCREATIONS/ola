import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { closeModal, toggleSubMenu } from '../funciones/animaciones';
import { useNavigate } from 'react-router-dom';

export default function EditarPerfil() {
  const [form, setForm] = useState({});
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || !user) return;

    setForm({
      firstName: user.firstName || '',
      secondName: user.secondName || '',
      surname: user.surname || '',
      secondSurname: user.secondSurname || '',
      email: user.email || '',
      username: user.username || '',
      role: typeof user.role === 'object' ? user.role.name : user.role
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));


    // Validar contraseña si aplica
    if (passwords.new || passwords.confirm) {
      if (passwords.new !== passwords.confirm) {
        return Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      }
      if (passwords.new.length < 6) {
        return Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      }
    }

    try {
      // 1. Actualizar perfil
      const res = await fetch('http://localhost:5000/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Error al actualizar perfil');

      // 2. Si hay cambio de contraseña
      if (passwords.new) {
        const resPass = await fetch('http://localhost:5000/api/users/change-password', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token
          },
          body: JSON.stringify({ newPassword: passwords.new })
        });

        const data = await resPass.json();
        if (!resPass.ok) throw new Error(data.message || 'Error al cambiar la contraseña');

        // Contraseña cambiada -> cerrar sesión
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        Swal.fire({
          icon: 'success',
          title: 'Contraseña actualizada',
          text: 'Debes iniciar sesión nuevamente',
          confirmButtonText: 'OK'
        }).then(() => {

          navigate('/');

        });

        return; // Detener ejecución para no mostrar el otro Swal
      }

      // 3. Actualizar localStorage y vista si NO se cambió la contraseña
      const updatedUser = {
        ...user,
        ...form,
        role: user.role // no cambia
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));

      Swal.fire('Éxito', 'Perfil actualizado correctamente', 'success');
      closeModal('editar-perfil');
      setPasswords({ new: '', confirm: '' });

    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const modal = document.getElementById('editar-perfil');
      const content = modal?.querySelector('.modal-content');

      if (modal && content && !content.contains(e.target) && modal.style.display !== 'none') {
        closeModal('editar-perfil');
      }
    };


    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <form className="modal" id="editar-perfil" onSubmit={guardarCambios}>

      <div className="modal-content">
        <div className="form-group">
          <label>Primer nombre</label>
          <input className='entrada' type="text" name="firstName" value={form.firstName || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Segundo nombre</label>
          <input className='entrada' type="text" name="secondName" value={form.secondName || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Primer apellido</label>
          <input className='entrada' type="text" name="surname" value={form.surname || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Segundo apellido</label>
          <input className='entrada' type="text" name="secondSurname" value={form.secondSurname || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Correo</label>
          <input className='entrada' type="email" name="email" value={form.email || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Nombre de usuario</label>
          <input className='entrada' type="text" name="username" value={form.username || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Rol</label>
          <input className='entrada' type="text" value={form.role || ''} readOnly disabled />
        </div>

        <div className="buttons">
          <button className='btn btn-secondary' type='button' onClick={() => toggleSubMenu('changePassword')}>
            Cambiar contraseña
          </button>
        </div>

        <div className='dropdown' id='changePassword' style={{ border: '1px solid #ccc', padding: '0.5rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input className='entrada' type="password" name="new" value={passwords.new} onChange={handlePasswordChange} />
          </div>
          <div className="form-group">
            <label>Confirmar nueva contraseña</label>
            <input className='entrada' type="password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} />
          </div>
        </div>

        <div className="buttons">
          <button className="btn btn-secondary" type='button' onClick={() => closeModal('editar-perfil')}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            Guardar Cambios
          </button>

        </div>
      </div>

    </form>
  );
}
