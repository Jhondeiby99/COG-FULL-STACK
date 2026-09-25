import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from "../assets/icons/index.ts";

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
          <img src={Icons.iconFiltrosUrl} className="icon-svg" alt="Filtros" />
          Filtros avanzados
          <span className="badge">3</span>
        </button>

        {/* Buscador */}
        <div className="header-search">
          <img src={Icons.SearchIcon} className="icon-search" alt="Buscar" />
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
            <img src={Icons.arrowDownIcon} className="icon-arrow" alt="Desplegar" />
          </button>
          </Link>
          <div className="avatar-circle small">
            <img src={Icons.PersonIcon} className="icon-person" alt="Usuario" />
          </div>
        </div>
      </div>
    </header>
  );
}