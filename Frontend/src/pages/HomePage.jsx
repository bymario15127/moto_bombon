// src/pages/HomePage.jsx
import { Link } from "react-router-dom";

const HomePage = () => {
  const servicios = [
    {
      nombre: "Lavado Básico",
      imagen: "/assets/lavado-basico.jpg",
      descripcion: "Lavado completo exterior con productos de calidad.",
    },
    {
      nombre: "Lavado Premium",
      imagen: "/assets/lavado-premium.jpg",
      descripcion: "Lavado completo + encerado y brillo profesional.",
    },
    {
      nombre: "Lavado Detallado",
      imagen: "/assets/lavado-detallado.jpg",
      descripcion: "Lavado completo, motor, encerado y protección total.",
    },
  ];

  return (
    <div className="centered-page">
      <div className="min-h-screen bg-white">
        <header className="text-center py-8">
          <h1 className="text-4xl font-yeseva text-primary">MOTOBOMBON</h1>
          <p className="text-lg text-gray-600 mt-2">Tu moto brillante como nueva 🏍️✨</p>
        </header>

      <section className="grid md:grid-cols-3 gap-6 px-8 py-6">
        {servicios.map((s) => (
          <div key={s.nombre} className="rounded-2xl shadow-lg hover:shadow-primary/30 transition-all overflow-hidden">
            <img src={s.imagen} alt={s.nombre} className="w-full h-56 object-cover hover:scale-105 transition-transform" />
            <div className="p-4 text-center">
              <h3 className="font-yeseva text-xl text-primary">{s.nombre}</h3>
              <p className="text-gray-600 mt-2">{s.descripcion}</p>
              <Link to="/reserva" state={{ fromHome: true }}>
                <button className="btn-primary mt-4">Reservar</button>
              </Link>
            </div>
          </div>
        ))}
      </section>
      </div>
    </div>
  );
};

export default HomePage;
