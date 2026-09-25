import React from 'react';
import * as Icons from "../assets/icons/index.ts";

interface FooterProps {
  // Las props de búsqueda ya no son necesarias aquí, pero las dejamos opcionales si las requieres después
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterClick?: () => void;
  searchPlaceholder?: string;
}

export function Footer(_props: FooterProps) {
  return (
    <footer className="home-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2 className="time-text">7:34 AM</h2>
          <p>Plataforma cívica de solidaridad transparente que canaliza voluntades hacia causas de impacto social comprobable.</p>
          <span className="verified-tag blue">
            <img src={Icons.IconVerify} className="icon-svg" alt="Icono de Verificación" /> Impacto Verificado
          </span>
        </div>
        
        <div className="footer-links">
          <div className="link-group">
            <h4 className='font-bold'>Explorar</h4>
            <a href="#">Necesidades activas</a>
            <a href="#">Directorio de Fundaciones</a>
            <a href="#">Bolsa de Voluntariado</a>
            <a href="#">Cómo funciona</a>
          </div>
          <div className="link-group">
            <h4 className='font-bold'>Comunidad</h4>
            <a href="#">Registrar Organización</a>
            <a href="#">Sumarse como Voluntario</a>
            <a href="#">Preguntas frecuentes</a>
            <a href="#">Reportes de Rendición</a>
          </div>
          <div className="link-group">
            <h4 className='font-bold'>Legal & Contacto</h4>
            <a href="#">Política de Privacidad</a>
            <a href="#">Términos de Servicio</a>
            <a href="#">Canal de Coordinación</a>
            <a href="#" className="email-link">contacto@734am.org</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2025 7:34 AM. Plataforma de solidaridad y voluntariado comunitario.</p>
        <p>Despertando el compromiso social a cada hora.</p>
      </div>
    </footer>
  );
}