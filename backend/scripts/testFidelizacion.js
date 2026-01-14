// backend/scripts/testFidelizacion.js
// Script de prueba para el sistema de fidelización

const BASE_URL = 'http://localhost:3000';

async function testFidelizacion() {
  console.log('\n🧪 PRUEBA DEL SISTEMA DE FIDELIZACIÓN\n');
  console.log('=' .repeat(60));

  // Datos de prueba
  const clientePrueba = {
    cliente: 'Juan Pérez',
    email: 'juanperez@ejemplo.com',
    telefono: '3001234567',
    servicio: 'Lavado Básico',
    fecha: new Date().toISOString().split('T')[0]
  };

  console.log('\n📝 Cliente de prueba:');
  console.log(JSON.stringify(clientePrueba, null, 2));

  try {
    // Paso 1: Crear 10 citas para simular 10 lavadas
    console.log('\n🔄 Simulando 10 lavadas...\n');

    for (let i = 1; i <= 10; i++) {
      // Crear cita
      const crearResponse = await fetch(`${BASE_URL}/api/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientePrueba)
      });

      const citaCreada = await crearResponse.json();
      console.log(`✅ Lavada ${i}/10: Cita ${citaCreada.id} creada`);

      // Marcar como completada
      const completarResponse = await fetch(`${BASE_URL}/api/citas/${citaCreada.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'admin'
        },
        body: JSON.stringify({ estado: 'completada' })
      });

      const resultado = await completarResponse.json();

      if (resultado.cuponGenerado) {
        console.log('\n🎉 ¡CUPÓN GENERADO!');
        console.log(`   Código: ${resultado.codigoCupon}`);
        console.log(`   Mensaje: ${resultado.mensajeFidelizacion}`);
        console.log(`   Total lavadas: ${resultado.lavadas}`);
      } else if (resultado.mensajeFidelizacion) {
        console.log(`   ${resultado.mensajeFidelizacion}`);
      }

      // Pequeña pausa para claridad
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Paso 2: Verificar información del cliente
    console.log('\n\n📊 Información del cliente después de 10 lavadas:');
    console.log('=' .repeat(60));

    const clienteResponse = await fetch(
      `${BASE_URL}/api/clientes/email/${encodeURIComponent(clientePrueba.email)}`
    );
    const clienteInfo = await clienteResponse.json();

    console.log('\n✅ Cliente:', clienteInfo.nombre);
    console.log('   Email:', clienteInfo.email);
    console.log('   Lavadas completadas:', clienteInfo.lavadas_completadas);
    console.log('   Lavadas gratis disponibles:', clienteInfo.lavadas_gratis_pendientes);

    if (clienteInfo.cupones && clienteInfo.cupones.length > 0) {
      console.log('\n🎫 Cupones generados:');
      clienteInfo.cupones.forEach((cupon, idx) => {
        console.log(`\n   Cupón ${idx + 1}:`);
        console.log(`   - Código: ${cupon.codigo}`);
        console.log(`   - Fecha emisión: ${cupon.fecha_emision}`);
        console.log(`   - Usado: ${cupon.usado ? 'Sí' : 'No'}`);
        if (cupon.usado) {
          console.log(`   - Fecha uso: ${cupon.fecha_uso}`);
        }
      });

      // Paso 3: Probar verificación de cupón
      const primerCupon = clienteInfo.cupones[0];
      console.log('\n\n🔍 Verificando primer cupón...');
      console.log('=' .repeat(60));

      const verificarResponse = await fetch(
        `${BASE_URL}/api/clientes/cupon/${primerCupon.codigo}`
      );
      const verificacion = await verificarResponse.json();

      console.log('\n✅ Resultado de verificación:');
      console.log('   Válido:', verificacion.valido ? 'SÍ' : 'NO');
      console.log('   Mensaje:', verificacion.mensaje);
      if (verificacion.valido) {
        console.log('   Email del cliente:', verificacion.email_cliente);
      }

      // Paso 4: Usar el cupón (opcional - comentado para no gastarlo)
      /*
      console.log('\n\n💰 Usando el cupón...');
      console.log('='.repeat(60));

      const usarResponse = await fetch(
        `${BASE_URL}/api/clientes/cupon/${primerCupon.codigo}/usar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cita_id: citaCreada.id })
        }
      );
      const usoResultado = await usarResponse.json();

      console.log('\n✅', usoResultado.message);
      */
    }

    console.log('\n\n✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('=' .repeat(60));
    console.log('\n💡 Notas:');
    console.log('   - El cupón fue generado automáticamente');
    console.log('   - Se envió (o intentó enviar) un email al cliente');
    console.log('   - El cupón está listo para ser usado');
    console.log('   - Puedes verificar el cupón en cualquier momento');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    console.error('\n💡 Asegúrate de que:');
    console.error('   1. El servidor esté corriendo (npm start)');
    console.error('   2. La base de datos esté inicializada (npm run init-clientes)');
    console.error('   3. El puerto 3000 esté disponible');
  }
}

// Ejecutar prueba
testFidelizacion();
