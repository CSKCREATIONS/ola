import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { closeModal } from "../funciones/animaciones";

export default function AgregarUsuario() {
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [surname, setSurname] = useState('');
  const [secondSurname, setSecondSurname] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);


  const toggleRole = (roleName) => {
    setRolesSeleccionados(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(r => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  };

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
  }, []);

  //genera password automaticamente
  const generarPassword = () => {
    const letrasMayus = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letrasMinus = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';

    const mayus = letrasMayus.charAt(Math.floor(Math.random() * letrasMayus.length)) +
      letrasMayus.charAt(Math.floor(Math.random() * letrasMayus.length));
    const resto = (letrasMinus + numeros)
      .split('')
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)
      .join('');

    return (mayus + resto).split('').sort(() => 0.5 - Math.random()).join('');
  };


  //genera nombre de usuario automaticamente con prefigo jla
  const generarUsername = () => {
    const random = Math.floor(100 + Math.random() * 900);
    return `jla${random}`;
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    const usuarioNombre = generarUsername()
    const nuevaPassword = generarPassword();
    const usuario = {
      firstName,
      secondName,
      surname,
      secondSurname,
      email,
      username: usuarioNombre,
      password: nuevaPassword,
      role
    };

    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify(usuario)
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Password generada: ', nuevaPassword)
        Swal.fire({
          title: 'Usuario creado correctamente',
          html: `
            <p><strong>Nombre de usuario:</strong> ${usuarioNombre}</p>
            <p><strong>Contraseña:</strong> ${nuevaPassword}</p>`,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });

        closeModal('agregar-usuario');
      } else {
        Swal.fire({
          text: data.message || 'Error al crear usuario',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('Error al enviar usuario:', error);
      Swal.fire({
        text: 'Error del servidor',
        icon: 'error'
      });
    }
  };

  return (
    <form className='modal' id="agregar-usuario" onSubmit={(e) => {
      e.preventDefault(); // Previene recarga
      handleSubmit();
    }}>
      <div className="modal-content">
        <div className="double">
          <div className="form-group">
            <label>Primer nombre</label>
            <input className='entrada' type="text" autoFocus value={firstName} onChange={e => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Segundo nombre</label>
            <input className='entrada' type="text" value={secondName} onChange={e => setSecondName(e.target.value)} />
          </div>
        </div>
        <div className="double">
          <div className="form-group">
            <label>Primer apellido</label>
            <input className='entrada' type="text" value={surname} onChange={e => setSurname(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Segundo apellido</label>
            <input className='entrada' type="text" value={secondSurname} onChange={e => setSecondSurname(e.target.value)} />
          </div>
        </div>
        <div className="triple">
          <div className="form-group">
            <label>Rol</label>
            <select className='entrada' value={role} onChange={e => setRole(e.target.value)} required>
              <option value="" disabled>Seleccione un rol</option>
              {Array.isArray(rolesDisponibles) && rolesDisponibles.map(r => (
                <option key={r._id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Correo</label>
            <input className='entrada' type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="buttons">
          <button
            type="button"
            onClick={() => closeModal('agregar-usuario')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">Crear Usuario</button>
        </div>
      </div>

    </form>


  );
}
