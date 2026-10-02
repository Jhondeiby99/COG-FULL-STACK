import React from 'react';
import * as Icons from "../assets/icons/index.ts";

interface FooterProps {
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterClick?: () => void;
  searchPlaceholder?: string;
}

export function Footer(_props: FooterProps) {
  return (
    <footer className="w-full bg-[#071d37] text-white pt-12 pb-6 px-4 md:px-8 lg:px-16 flex flex-col gap-8 md:gap-12 mt-auto">
      {/* Contenedor Superior (Marca + Enlaces) */}
      <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-16 w-full max-w-7xl mx-auto">
        
        {/* Columna Izquierda: Marca y Descripción */}
        <div className="flex flex-col gap-4 lg:w-1/3">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">7:34 AM</h2>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-sm">
            Plataforma cívica de solidaridad transparente que canaliza voluntades hacia causas de impacto social comprobable.
          </p>
          <div className="inline-flex items-center gap-2 bg-[#005684]/30 border border-[#005684] rounded-full px-4 py-1.5 w-max mt-2">
            <img src={Icons.IconVerify} className="w-4 h-4 md:w-5 md:h-5 invert opacity-90" alt="Icono de Verificación" /> 
            <span className="text-xs md:text-sm font-semibold text-blue-200">Impacto Verificado</span>
          </div>
        </div>
        
        {/* Columnas Derecha: Enlaces */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full lg:w-2/3">
          {/* Grupo 1: Explorar */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-base md:text-lg text-white mb-2">Explorar</h4>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Necesidades activas</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Directorio de Fundaciones</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Bolsa de Voluntariado</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Cómo funciona</a>
          </div>
          
          {/* Grupo 2: Comunidad */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-base md:text-lg text-white mb-2">Comunidad</h4>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Registrar Organización</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Sumarse como Voluntario</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Preguntas frecuentes</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Reportes de Rendición</a>
          </div>
          
          {/* Grupo 3: Legal & Contacto */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-base md:text-lg text-white mb-2">Legal & Contacto</h4>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Política de Privacidad</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Términos de Servicio</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Canal de Coordinación</a>
            <a href="mailto:contacto@734am.org" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1 break-all">
              contacto@734am.org
            </a>
          </div>
        </div>
      </div>
      
      {/* Separador */}
      <hr className="border-gray-700 w-full max-w-7xl mx-auto" />
      
      {/* Contenedor Inferior (Copyright) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm text-gray-500 w-full max-w-7xl mx-auto text-center md:text-left">
        <p>© 2025 7:34 AM. Plataforma de solidaridad y voluntariado comunitario.</p>
        <p className="font-medium text-gray-400">Despertando el compromiso social a cada hora.</p>
      </div>
    </footer>
  );
}