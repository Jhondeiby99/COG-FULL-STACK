import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Icon } from '../components/Icon';
import { CORREO_DATOS_PERSONALES, VERSION_POLITICA_DATOS } from '../lib/politicaDatos';

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-extrabold text-[#071d37]">{titulo}</h2>
      <div className="text-sm text-[#475569] leading-relaxed flex flex-col gap-2">{children}</div>
    </section>
  );
}

/** Política de Tratamiento de Datos Personales (Ley 1581 de 2012 y Decreto 1377 de 2013) */
export function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
      <Header />
      <main className="flex-1 px-4 py-10">
        <article className="text-left mx-auto w-full max-w-3xl bg-white rounded-3xl border border-[#e2e8f0] shadow-sm p-6 md:p-10 flex flex-col gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#eef6ff] text-[#005684] text-[11px] font-bold px-2.5 py-1 rounded-full">
              <Icon name="candado" size={12} /> Ley 1581 de 2012
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#071d37] mt-3">Política de Tratamiento de Datos Personales</h1>
            <p className="text-xs text-[#94a3b8] mt-1">Versión {VERSION_POLITICA_DATOS} · Vigente desde el 8 de octubre de 2026</p>
          </div>

          <Seccion titulo="1. Responsable del tratamiento">
            <p>
              El responsable del tratamiento es el equipo del proyecto <b>7:34 AM</b>, plataforma desarrollada como proyecto de grado en la
              Fundación Tecnológica Autónoma del Pacífico, Santiago de Cali, Colombia. Canal de atención para asuntos de datos personales:{' '}
              <a href={`mailto:${CORREO_DATOS_PERSONALES}`} className="font-bold text-[#005684] hover:underline">{CORREO_DATOS_PERSONALES}</a>.
            </p>
          </Seccion>

          <Seccion titulo="2. Datos que recolectamos">
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li><b>Cuenta:</b> correo electrónico y contraseña (la contraseña se guarda cifrada por el proveedor de autenticación).</li>
              <li><b>Voluntarios y donantes:</b> nombre, ciudad, profesión, habilidades, disponibilidad horaria, presentación y, si la cargan, fotografía y certificaciones.</li>
              <li><b>Fundaciones:</b> razón social, NIT, representante legal, teléfono, dirección, ciudad, descripción, imágenes y documentos legales (RUT, certificado de Cámara de Comercio y personería jurídica).</li>
              <li><b>Uso de la plataforma:</b> mensajes de contacto, calificaciones, notificaciones y registro de inicios de sesión (dispositivo y fecha).</li>
            </ul>
            <p>No solicitamos datos sensibles como origen étnico, salud, orientación política o religiosa. La fotografía de perfil es opcional.</p>
          </Seccion>

          <Seccion titulo="3. Finalidades">
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Crear y administrar la cuenta y el perfil del usuario.</li>
              <li>Publicar las necesidades de las fundaciones y los perfiles de voluntarios en el directorio público.</li>
              <li>Permitir el contacto entre fundaciones, voluntarios y donantes.</li>
              <li>Verificar la existencia legal de las fundaciones antes de aprobarlas.</li>
              <li>Enviar notificaciones de la plataforma y avisos de emergencia a quienes los habiliten.</li>
              <li>Garantizar la seguridad de la plataforma y prevenir abusos.</li>
            </ul>
          </Seccion>

          <Seccion titulo="4. Información pública y privada">
            <p>
              Son públicos el perfil de las fundaciones aprobadas (sin sus documentos legales) y el perfil de los voluntarios con perfil completo.
              Los documentos legales de las fundaciones son privados: solo acceden la propia fundación y los administradores de la plataforma.
              El correo y el teléfono de contacto que cada usuario decida publicar en su perfil quedan visibles para los visitantes.
            </p>
          </Seccion>

          <Seccion titulo="5. Derechos del titular">
            <p>Como titular de los datos tiene derecho a:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Conocer, actualizar y rectificar sus datos personales.</li>
              <li>Solicitar prueba de la autorización otorgada.</li>
              <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
              <li>Revocar la autorización y solicitar la supresión de sus datos cuando no exista un deber legal de conservarlos.</li>
              <li>Acceder de forma gratuita a sus datos.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.</li>
            </ul>
          </Seccion>

          <Seccion titulo="6. Cómo ejercer sus derechos">
            <p>
              Escriba a <a href={`mailto:${CORREO_DATOS_PERSONALES}`} className="font-bold text-[#005684] hover:underline">{CORREO_DATOS_PERSONALES}</a> indicando
              su nombre, el correo de su cuenta y su solicitud. Las consultas se responden en un máximo de diez (10) días hábiles y los reclamos en
              un máximo de quince (15) días hábiles, conforme a los artículos 14 y 15 de la Ley 1581 de 2012. Puede actualizar la mayoría de sus
              datos directamente desde su perfil.
            </p>
          </Seccion>

          <Seccion titulo="7. Seguridad y proveedores">
            <p>
              Aplicamos control de acceso por rol en la base de datos, almacenamiento privado para los documentos legales y enlaces temporales
              para consultarlos. Los datos se alojan en servicios de Supabase (base de datos, autenticación y archivos) y el sitio se publica en
              GitHub Pages; estos proveedores pueden almacenar la información en servidores ubicados fuera de Colombia y actúan como encargados del tratamiento.
            </p>
          </Seccion>

          <Seccion titulo="8. Menores de edad y vigencia">
            <p>
              La plataforma está dirigida a personas mayores de 18 años y a organizaciones legalmente constituidas. Los datos se conservan mientras
              la cuenta esté activa o mientras sea necesario para las finalidades descritas. Cualquier cambio en esta política se publicará en esta
              página con una nueva versión.
            </p>
          </Seccion>

          <div className="border-t border-[#f1f5f9] pt-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <p className="text-xs text-[#94a3b8]">Marco legal: Ley Estatutaria 1581 de 2012 y Decreto 1377 de 2013.</p>
            <Link to="/signup" className="text-xs font-bold text-[#005684] hover:underline">Volver al registro →</Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
