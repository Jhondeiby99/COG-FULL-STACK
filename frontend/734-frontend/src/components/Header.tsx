import React from 'react';
import iconFiltrosUrl from '../assets/icons/icon-filtros.svg';
import SearchIcon from '../assets/icons/SearchIcon.svg';
import arrowDownIcon from '../assets/icons/arrowDownIcon.svg';
import PersonIcon from '../assets/icons/PersonIcon.svg';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterClick?: () => void;
  searchPlaceholder?: string;
}

export function Header({ 
  onSearchChange, 
  onFilterClick, 
  searchPlaceholder = "Causas, fundaciones..." 
}: HeaderProps) {
  return (
    <header className="home-header">
      <div className="header-left">
        {/* Botón de Filtros */}
        <button className="btn-filtros" onClick={onFilterClick} type="button">
          <img src={iconFiltrosUrl} className="icon-svg" alt="Filtros" />
          Filtros avanzados
          <span className="badge">3</span>
        </button>

        {/* Buscador */}
        <div className="header-search">
          <img src={SearchIcon} className="icon-search" alt="Buscar" />
          <input 
            type="text" 
            placeholder={searchPlaceholder} 
            onChange={onSearchChange} 
          />
        </div>
      </div>
      
      {/* Centro - Logo / Hora */}
      <div className="header-center">
        <div className="brand-logo-center">
          <span className="time-text">7:34 AM</span>
          <span className="brand-slogan">Conectando voluntades y causas</span>
        </div>
      </div>

      {/* Derecha - Acciones de Usuario */}
      <div className="header-right">
        <div className="header-right-inicre">
          <a href="/login" className="nav-link">Iniciar sesión</a>
          <Link
          to="/signup">
          <button className="btn-primary small" type="button">
            Crear usuario 
            <img src={arrowDownIcon} className="icon-arrow" alt="Desplegar" />
          </button>
          </Link>
          <div className="avatar-circle small">
            <img src={PersonIcon} className="icon-person" alt="Usuario" />
          </div>
        </div>
      </div>
    </header>
  );
}