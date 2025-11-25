// scripts/generateHash.js
// Utilidad para generar hashes de contraseñas
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function generateHash() {
  rl.question('Ingresa la contraseña a hashear: ', async (password) => {
    if (!password || password.length < 8) {
      console.log('❌ La contraseña debe tener al menos 8 caracteres');
      rl.close();
      return;
    }
    
    try {
      const hash = await bcrypt.hash(password, 10);
      console.log('\n✅ Hash generado:');
      console.log(hash);
      console.log('\nCopia este hash y pégalo en tu archivo .env');
      console.log('Ejemplo: ADMIN_PASSWORD_HASH=' + hash);
    } catch (error) {
      console.error('❌ Error al generar hash:', error);
    }
    
    rl.close();
  });
}

generateHash();
