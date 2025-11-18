/*
  Seed script to initialize roles and an admin user using Mongoose
  Usage:
    - Local:    node backend/scripts/seed.js
    - Docker:   docker compose run --rm backend node scripts/seed.js
*/
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env' });
const mongoose = require('mongoose');
const path = require('node:path');

// Models
const Role = require('../models/Role');
const User = require('../models/User');

// Permissions
const PERM = require('../config/permissions.config');

const flattenPerms = (obj) => {
  const out = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') out.push(val);
    else if (val && typeof val === 'object') out.push(...flattenPerms(val));
  }
  return out;
};

async function main() {
  const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/pangea';
  console.log(`[seed] Connecting to ${MONGO_URL}`);
  await mongoose.connect(MONGO_URL, { autoIndex: true });

  const allPerms = flattenPerms(PERM);

  // Upsert roles
  const rolesToEnsure = [
    { name: 'admin', permissions: allPerms, enabled: true },
    { name: 'ventas', permissions: [
        PERM.VENTAS.CREAR, PERM.VENTAS.VER, PERM.VENTAS.VERENTREGADOS,
        PERM.VENTAS.VERAGENDADOS, PERM.VENTAS.VERDESPACHADOS,
        PERM.VENTAS.VERCANCELADOS, PERM.VENTAS.VERREPORTES,
        PERM.COTIZACIONES.VER, PERM.COTIZACIONES.CREAR, PERM.COTIZACIONES.ENVIAR
      ].filter(Boolean), enabled: true },
    { name: 'compras', permissions: [
        PERM.COMPRAS.VER, PERM.COMPRAS.CREAR, PERM.COMPRAS.VERREPORTES,
        PERM.PROVEEDORES.VER, PERM.PROVEEDORES.CREAR, PERM.PROVEEDORES.EDITAR
      ].filter(Boolean), enabled: true },
  ];

  const ensuredRoles = {};
  for (const r of rolesToEnsure) {
    const doc = await Role.findOneAndUpdate({ name: r.name }, r, { upsert: true, new: true });
    ensuredRoles[r.name] = doc;
    console.log(`[seed] Role ensured: ${r.name}`);
  }

  // Ensure admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@pangea.local';
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  let admin = await User.findOne({ email: adminEmail }).select('+password');
  if (!admin) {
    admin = new User({
      firstName: 'Admin',
      secondName: '',
      surname: 'Principal',
      secondSurname: '',
      username: adminUsername,
      email: adminEmail,
      password: adminPassword, // Will be hashed by pre-save hook
      role: ensuredRoles['admin']._id,
      enabled: true,
      mustChangePassword: true,
      provisional: false,
    });
    await admin.save();
    console.log(`[seed] Admin user created: ${adminEmail}`);
  } else {
    console.log(`[seed] Admin user already exists: ${adminEmail}`);
  }

  await mongoose.disconnect();
  console.log('[seed] Done.');
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
