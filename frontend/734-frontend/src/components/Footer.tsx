import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as Icons from "../assets/icons/index.ts";

interface FooterProps {
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterClick?: () => void;
  searchPlaceholder?: string;
}

const enlaceClase = 'text-sm text-gray-400 hover:text-white transition-colors py-1 w-fit text-left cursor-pointer';

export function Footer(_props: FooterProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Lleva a una sección del inicio; si no estamos en el inicio, navega y espera a que se pinte
  const irASeccion = (id: string) => {
    const desplazar = (intentos: number) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (intentos > 0) setTimeout(() => desplazar(intentos - 1), 150);
    };
    if (location.pathname !== '/') navigate('/');
    desplazar(20);
  };

  return (
    <footer className="w-full bg-[#071d37] text-white pt-10 md:pt-12 pb-6 px-4 sm:px-6 md:px-8 lg:px-16 mt-auto shrink-0">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 md:gap-10">
        {/* Marca + enlaces */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_2fr] gap-10 lg:gap-16">

          {/* Marca */}
          <div className="flex flex-col gap-4 items-center text-center sm:items-start sm:text-left">
            <Link to="/" className="text-3xl font-extrabold tracking-tight text-white w-fit">7:34 AM</Link>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-sm">
              Plataforma cívica de solidaridad transparente que canaliza voluntades hacia causas de impacto social comprobable.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#005684]/30 border border-[#005684] rounded-full px-4 py-1.5 w-max mt-1">
              <img src={Icons.IconVerify} className="w-4 h-4 md:w-5 md:h-5 invert opacity-90" alt="" />
              <span className="text-xs md:text-sm font-semibold text-blue-200">Impacto Verificado</span>
            </div>
          </div>

          {/* Enlaces */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8">
            <nav className="flex flex-col gap-2" aria-label="Explorar">
              <h4 className="font-bold text-base md:text-lg text-white mb-1">Explorar</h4>
              <button type="button" onClick={() => irASeccion('necesidades')} className={enlaceClase}>Necesidades activas</button>
              <Link to="/explorar?tab=fundaciones" className={enlaceClase}>Directorio de Fundaciones</Link>
              <Link to="/explorar?tab=voluntarios" className={enlaceClase}>Bolsa de Voluntariado</Link>
            </nav>

            <nav className="flex flex-col gap-2" aria-label="Comunidad">
              <h4 className="font-bold text-base md:text-lg text-white mb-1">Comunidad</h4>
              <Link to="/signup" className={enlaceClase}>Registrar Organización</Link>
              <Link to="/signup" className={enlaceClase}>Sumarse como Voluntario</Link>
              <Link to="/login" className={enlaceClase}>Iniciar sesión</Link>
            </nav>

            <nav className="flex flex-col gap-2 col-span-2 sm:col-span-1" aria-label="Contacto">
              <h4 className="font-bold text-base md:text-lg text-white mb-1">Contacto</h4>
              <a href="mailto:contacto@734am.org" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1 break-all w-fit">
                contacto@734am.org
              </a>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[220px]">
                Escríbenos para alianzas, soporte o reportes de transparencia.
              </p>
            </nav>
          </div>
        </div>

        <hr className="border-gray-700 w-full" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 text-center md:text-left">
          <p>© {new Date().getFullYear()} 7:34 AM. Plataforma de solidaridad y voluntariado comunitario.</p>
          <p className="font-medium text-gray-400">Despertando el compromiso social a cada hora.</p>
        </div>
      </div>
    </footer>
  );
}
