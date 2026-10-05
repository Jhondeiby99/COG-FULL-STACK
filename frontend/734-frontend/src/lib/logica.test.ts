import { describe, expect, it, vi } from 'vitest';

// Las funciones probadas son lógica pura; el cliente de Supabase no se usa en estas pruebas
vi.mock('./supabase', () => ({ supabase: {} }));

import { porcentajeRecaudo, PRIORIDAD_ESTILOS } from './necesidades';
import { validarDocumento, MAX_DOCUMENTO_MB, TIPOS_DOCUMENTO } from './documentos';
import { iconoDesdeEmoji, ICONOS } from './iconos';

const archivo = (nombre: string, tipo: string, bytes: number) => new File([new Uint8Array(bytes)], nombre, { type: tipo });

describe('porcentajeRecaudo', () => {
  it('una necesidad resuelta siempre es 100%', () => {
    expect(porcentajeRecaudo({ completada: true, porcentaje_recaudado: 20 })).toBe(100);
  });

  it('redondea y limita el valor entre 0 y 100', () => {
    expect(porcentajeRecaudo({ completada: false, porcentaje_recaudado: 64.6 })).toBe(65);
    expect(porcentajeRecaudo({ completada: false, porcentaje_recaudado: 150 })).toBe(100);
    expect(porcentajeRecaudo({ completada: false, porcentaje_recaudado: -5 })).toBe(0);
  });

  it('acepta números en texto y trata valores inválidos como 0', () => {
    expect(porcentajeRecaudo({ completada: false, porcentaje_recaudado: '40' })).toBe(40);
    expect(porcentajeRecaudo({ completada: false, porcentaje_recaudado: 'abc' })).toBe(0);
    expect(porcentajeRecaudo({ completada: null, porcentaje_recaudado: null })).toBe(0);
  });

  it('hay estilo para cada prioridad', () => {
    expect(Object.keys(PRIORIDAD_ESTILOS).sort()).toEqual(['alta', 'baja', 'media']);
  });
});

describe('validarDocumento', () => {
  it('acepta PDF e imágenes dentro del límite', () => {
    expect(validarDocumento(archivo('rut.pdf', 'application/pdf', 1024))).toBeNull();
    expect(validarDocumento(archivo('camara.jpg', 'image/jpeg', 1024))).toBeNull();
    expect(validarDocumento(archivo('personeria.png', 'image/png', 1024))).toBeNull();
  });

  it('rechaza formatos no permitidos', () => {
    expect(validarDocumento(archivo('rut.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 10)))
      .toMatch(/no es un PDF ni una imagen/);
  });

  it(`rechaza archivos de más de ${MAX_DOCUMENTO_MB}MB`, () => {
    const grande = archivo('rut.pdf', 'application/pdf', MAX_DOCUMENTO_MB * 1024 * 1024 + 1);
    expect(validarDocumento(grande)).toMatch(/supera el máximo/);
  });

  it('pide exactamente los 3 documentos legales, cada uno con su consulta oficial', () => {
    expect(TIPOS_DOCUMENTO.map(t => t.tipo)).toEqual(['rut', 'camara_comercio', 'personeria']);
    TIPOS_DOCUMENTO.forEach(t => expect(t.verificacion.enlace.url).toMatch(/^https:\/\//));
  });
});

describe('iconoDesdeEmoji', () => {
  it('traduce los emojis guardados en la base de datos', () => {
    expect(iconoDesdeEmoji('✉️')).toBe('correo');
    expect(iconoDesdeEmoji('🚨')).toBe('emergencia');
    expect(iconoDesdeEmoji('🏛️')).toBe('institucion');
    expect(iconoDesdeEmoji('📱')).toBe('movil');
  });

  it('acepta nombres de ícono nuevos tal cual', () => {
    expect(iconoDesdeEmoji('banco')).toBe('banco');
    expect(iconoDesdeEmoji('documento')).toBe('documento');
  });

  it('usa el ícono por defecto si no lo reconoce o viene vacío', () => {
    expect(iconoDesdeEmoji('🦄')).toBe('info');
    expect(iconoDesdeEmoji(null, 'pago')).toBe('pago');
    expect(iconoDesdeEmoji('', 'correo')).toBe('correo');
  });

  it('todo nombre que devuelve existe en el registro de íconos', () => {
    ['✓', '📍', '⚠️', '✅', '🛡️', '📋', '💳', '🌙', '☀️', '🔑'].forEach(e => {
      expect(ICONOS).toHaveProperty(iconoDesdeEmoji(e));
    });
  });
});
