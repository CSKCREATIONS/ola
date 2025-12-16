const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    permissions:
        [{ type: String }],
    enabled: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
