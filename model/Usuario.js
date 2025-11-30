import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const usuarioSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Boolean,
        default: false,
        required: false
    }
});

// hashear la contraseña ANTES de guardarla
usuarioSchema.pre('save', async function(next) {
    // Solo hashea la contraseña si ha sido modificada (o es nueva)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Método para comparar la contraseña del login con la hasheada en la BD
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const Usuario = mongoose.model('Usuario', usuarioSchema);
export default Usuario;