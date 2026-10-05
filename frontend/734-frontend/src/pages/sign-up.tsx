import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Icon } from '../components/Icon';
import { DocumentosFundacion } from '../components/DocumentosFundacion';
import { subirDocumento } from '../lib/documentos';
import { DialogModal } from '../components/DialogModal';
import type { TipoDocumento } from '../lib/documentos';

export function SignUp() {
	const navigate = useNavigate();
	
	// Estado para el rol seleccionado (Fundación o Voluntario)
	const [activeRole, setActiveRole] = useState<'fundacion' | 'voluntario'>('fundacion');
	
	// Estado para enviar a Supabase
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Documentos legales elegidos antes de crear la cuenta; se suben al terminar el registro
	const [documentos, setDocumentos] = useState<Partial<Record<TipoDocumento, File>>>({});
	// Correo al que se envió el enlace de confirmación (cuando Supabase lo exige)
	const [correoPorConfirmar, setCorreoPorConfirmar] = useState<string | null>(null);
	
	const [formData, setFormData] = useState({
		nombreLegal: '',
		nit: '',
		representante: '',
		telefono: '',
		email: '',
		ubicacion: '',
		password: '',
		confirmPassword: ''
	});

	const [areas] = useState([
		'Educación & Infancia',
		'Seguridad Alimentaria',
		'Salud Comunitaria',
		'Medio Ambiente & Siembra',
		'Refugio & Hábitat',
	]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		if (formData.password !== formData.confirmPassword) {
			setError("Las contraseñas no coinciden");
			setLoading(false);
			return;
		}

		// La cuenta se crea con los datos del perfil; la base de datos crea la ficha de fundación o voluntario.
		// Así funciona igual con la confirmación de correo activada (sin sesión inmediata) o desactivada.
		const datosPerfil = activeRole === 'fundacion'
			? {
				rol: 'fundacion',
				nombre_legal: formData.nombreLegal.trim(),
				nit: formData.nit.trim(),
				representante_legal: formData.representante.trim(),
				telefono: formData.telefono.trim(),
				ubicacion: formData.ubicacion.trim(),
			}
			: {
				rol: 'voluntario',
				nombre_completo: formData.nombreLegal.trim(),
				ubicacion: formData.ubicacion.trim(),
			};

		const { data: authData, error: authError } = await supabase.auth.signUp({
			email: formData.email.trim(),
			password: formData.password,
			options: {
				data: datosPerfil,
				emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}login`,
			},
		});

		if (authError || !authData.user) {
			setError(authError?.message || 'Hubo un error al registrar tu cuenta.');
			setLoading(false);
			return;
		}

		// Sin sesión = Supabase pide confirmar el correo antes de entrar
		if (!authData.session) {
			setLoading(false);
			setCorreoPorConfirmar(formData.email.trim());
			return;
		}

		// Con sesión inmediata se suben ya los documentos elegidos (si alguno falla, se completa desde el perfil)
		if (activeRole === 'fundacion') {
			await Promise.allSettled(
				(Object.entries(documentos) as [TipoDocumento, File][]).map(([tipo, archivo]) => subirDocumento(authData.user!.id, tipo, archivo))
			);
		}

		navigate('/');
	};

	return (
		<div className="flex min-h-svh w-full flex-col bg-[#f6f9fb] text-left text-[15px] leading-normal text-[#23343f] font-sans">
			{correoPorConfirmar && (
				<DialogModal
					variant="exito"
					title="Revisa tu correo"
					message={`Enviamos un enlace de confirmación a ${correoPorConfirmar}. Ábrelo para activar tu cuenta y luego inicia sesión.${activeRole === 'fundacion' ? '\n\nDespués podrás subir tus documentos legales desde tu perfil, en la pestaña Documentos.' : ''}`}
					confirmLabel="Ir a iniciar sesión"
					onClose={() => navigate('/login')}
				/>
			)}
			<main className="flex-1 py-10">
				<div className="mx-auto w-full max-w-[1240px] px-4">
                    <div>
                        <div className='flex w-full justify-between'>
                            <div className="flex gap-3 items-center mb-4">
                                <p className='bg-[#DCE9FF] rounded-full px-2 py-1 font-bold text-[#006194] text-[11px]'>MEMBRESÍA 7:34 AM</p>
                                <p className='bg-[#213145] rounded-full px-2 py-1 font-bold text-white text-[11px]'>07:34 AM COT</p>
                            </div>
                            <div className="flex gap-1 items-center mb-4">
                                <p className='font-[500] text-[#3F4850] text-[12px]'>¿Ya tienes una cuenta activa?</p>
                                <Link to="/login">
                                    <p className=' font-[600] text-[#006194] text-[16px]'>Iniciar Sesión</p>
                                </Link>
                            </div>
                        </div>
                    </div>

					<div className="grid gap-8 lg:grid-cols-[2fr_360px]">
						<div>
							<div className='bg-white p-8 mb-4 rounded-xl'>
								<div className="mb-6 flex items-center justify-between">
									<div>
										<span className="inline-block px-1 text-[11px] text-[#071d37]">PASO 01 · PERFIL DE INGRESO</span>
										<h1 className="mt-0 px-1 text-[32px] font-bold text-[#071d37]">Selecciona tu modalidad de participación</h1>
										<p className="mt-0 px-1 text-[14px] text-[#64748b]">Elige tu rol en el ecosistema para adaptar los requerimientos legales, verificación de antecedentes y herramientas de gestión comunitaria.</p>
									</div>
								</div>

								<div className="mb-6 grid gap-6 md:grid-cols-3 items-center">
									{/* Opción: Fundación */}
									<button 
										type="button"
										onClick={() => setActiveRole('fundacion')}
										className={`relative blox items-start gap-4 rounded-2xl p-5 transition-all ${activeRole === 'fundacion' ? 'bg-[#DCE9FF] shadow-md border border-[#d6eaf9]' : 'bg-transparent border border-transparent hover:bg-gray-50'}`}
									>
                                        <div className="flex justify-between">
                                            <div className={`rounded-lg h-[48px] p-3 ${activeRole === 'fundacion' ? 'bg-[#006194]' : 'bg-[#e2e8f0]'}`}>
                                                <Icon name="fundacion" size={24} />                                        
                                            </div>
											{activeRole === 'fundacion' && (
												<div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#006194]">
													<div className="flex h-[8px] w-[11px] items-center justify-center">
														<Icon name="check" size={11} strokeWidth={3} />
													</div>
												</div>
											)}
                                        </div>
										<div className="text-left mt-2">
											<div className="text-xl font-[600] text-[#073044]">Soy una Fundación</div>
											<div className="mt-1 text-xs text-[#64748b]">Publica necesidades de tu comunidad y gestiona institucionalmente.</div>
											<div className="mt-3 flex items-center gap-1">
                                                <span className="text-xs text-[#0b76a8] font-bold">Gestion institucional & NIT</span>
                                                <Icon name="derecha" size={12} className="text-[#006194]" />
                                            </div>
										</div>
									</button>

									{/* Opción: Voluntario */}
									<button 
										type="button"
										onClick={() => setActiveRole('voluntario')}
										className={`relative blox items-start gap-4 rounded-2xl p-5 transition-all ${activeRole === 'voluntario' ? 'bg-[#DCE9FF] shadow-md border border-[#d6eaf9]' : 'bg-transparent border border-transparent hover:bg-gray-50'}`}
									>
                                        <div className="flex justify-between">
                                            <div className={`rounded-lg h-[48px] p-3 ${activeRole === 'voluntario' ? 'bg-[#006194]' : 'bg-[#e2e8f0]'}`}>
                                                <Icon name="voluntario" size={24} className="text-[#006194]" />                                        
                                            </div>
											{activeRole === 'voluntario' && (
												<div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#006194]">
													<div className="flex h-[8px] w-[11px] items-center justify-center">
														<Icon name="check" size={11} strokeWidth={3} />
													</div>
												</div>
											)}
                                        </div>
										<div className="text-left mt-2">
											<div className="text-xl font-[600] text-[#073044]">Quiero ser Voluntario / Donante</div>
											<div className="mt-1 text-xs text-[#64748b]">Ofrece tus talentos, tiempo, horas de voluntariado y apoya causas verificadas.</div>
                                            <div className="mt-3 flex items-center gap-1">
                                                <span className="text-xs text-[#0b76a8] font-bold">Perfil personal e impacto</span>
                                                <Icon name="derecha" size={12} className="text-[#006194]" />
                                            </div>
										</div>
									</button>

									<div className="hidden md:block" />
								</div>
							</div>

							<div className="rounded-xl bg-white p-4 shadow-sm border border-[#e6eef6] mb-6">
								<div className="flex items-center justify-between">
									<div className="text-sm font-bold text-[#0b2a3a]">
										{activeRole === 'fundacion' ? 'Paso 2 de 2: Información institucional y jurídica' : 'Paso 2 de 2: Información personal y de contacto'}
									</div>
									<div className="text-xs text-[#94a3b8]">50% completado</div>
								</div>
								<div className="mt-3 h-2 w-full rounded-full bg-[#e6eef6]">
									<div className="h-full rounded-full bg-[#007bb9]" style={{ width: '50%' }} />
								</div>
							</div>

							{/* Formulario */}
							<section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e6eef6] md:p-8">
								<div className="mb-4 flex items-center justify-between">
									<h2 className="text-lg font-extrabold text-[#0b2a3a]">
										{activeRole === 'fundacion' ? 'Datos de la Organización Sin Ánimo de Lucro' : 'Datos del Voluntario / Donante'}
									</h2>
									<div className="flex items-center gap-3">
										<span className="text-xs font-medium text-[#94a3b8]">50% completado</span>
										<span className="inline-flex items-center rounded-full bg-[#eef8ff] px-3 py-1 text-xs font-bold text-[#0b76a8]">Registro Oficial</span>
									</div>
								</div>

								<form className="flex flex-col gap-4" onSubmit={handleRegister}>
									<div className="grid gap-3 md:grid-cols-2">
										<div>
											<label className="text-xs font-bold text-[#475569]">
												{activeRole === 'fundacion' ? 'Nombre legal o razón social' : 'Nombre completo'} <span className="text-red-500">*</span>
											</label>
											<input name="nombreLegal" value={formData.nombreLegal} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm placeholder:text-[#a0aec0] focus:outline-none focus:ring-1 focus:ring-[#cfe8ff]" placeholder={activeRole === 'fundacion' ? "Ej. Fundación Huellas del Porvenir" : "Ej. Carolina Restrepo"} />
										</div>
										<div>
											<label className="text-xs font-bold text-[#475569]">
												{activeRole === 'fundacion' ? 'NIT / Número de Registro Jurídico' : 'Cédula / Documento de Identidad'} {activeRole === 'fundacion' && <span className="text-red-500">*</span>}
											</label>
											<input name="nit" value={formData.nit} onChange={handleChange} required={activeRole === 'fundacion'} className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm placeholder:text-[#a0aec0] focus:outline-none focus:ring-1 focus:ring-[#cfe8ff]" placeholder="900.123.456-7" />
										</div>
									</div>

									<div className="grid gap-3 md:grid-cols-2">
										<div>
											<label className="text-xs font-bold text-[#475569]">
												{activeRole === 'fundacion' ? 'Representante legal / Enlace' : 'Profesión o Especialidad'}
											</label>
											<input name="representante" value={formData.representante} onChange={handleChange} className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm" placeholder={activeRole === 'fundacion' ? "Nombre completo del representante" : "Ej. Médica Pediatra"} />
										</div>
										<div>
											<label className="text-xs font-bold text-[#475569]">Teléfono móvil de contacto</label>
											<input name="telefono" value={formData.telefono} onChange={handleChange} className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm" placeholder="+57 (300) 000-0000" />
										</div>
									</div>

									<div className="grid gap-3 md:grid-cols-2">
										<div>
											<label className="text-xs font-bold text-[#475569]">Correo electrónico {activeRole === 'fundacion' ? 'institucional' : ''} <span className="text-red-500">*</span></label>
											<input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm" placeholder={activeRole === 'fundacion' ? "direccion@miorg.org" : "tucorreo@ejemplo.com"} />
										</div>
										<div>
											<label className="text-xs font-bold text-[#475569]">Comuna / Localidad / Sector</label>
											<input name="ubicacion" value={formData.ubicacion} onChange={handleChange} className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm" placeholder="Ej. Comuna 13 - San Javier" />
										</div>
									</div>

									{/* Nuevos campos de Contraseña (Misma estética de grid) */}
									<div className="grid gap-3 md:grid-cols-2">
										<div>
											<label className="text-xs font-bold text-[#475569]">Contraseña de acceso <span className="text-red-500">*</span></label>
											<input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm placeholder:text-[#a0aec0] focus:outline-none focus:ring-1 focus:ring-[#cfe8ff]" placeholder="••••••••" />
										</div>
										<div>
											<label className="text-xs font-bold text-[#475569]">Confirmar contraseña <span className="text-red-500">*</span></label>
											<input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm placeholder:text-[#a0aec0] focus:outline-none focus:ring-1 focus:ring-[#cfe8ff]" placeholder="••••••••" />
										</div>
									</div>

									{activeRole === 'fundacion' && (
										<>
											<div>
												<label className="text-xs font-bold text-[#475569]">Áreas prioritarias de impacto</label>
												<div className="mt-2 flex flex-wrap gap-2">
													{areas.map((a) => (
														<button key={a} type="button" className="flex items-center gap-2 rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#005684]">
															<span className="text-[11px]"><Icon name="punto" size="1.1em" filled /></span>
															{a}
														</button>
													))}
												</div>
											</div>

											<div>
												<label className="text-xs font-bold text-[#475569]">Documentos legales (RUT, Cámara de Comercio y Personería jurídica)</label>
												<p className="text-[11px] text-[#94a3b8] mt-1 mb-3">Son necesarios para aprobar tu fundación. Si aún no los tienes a mano, podrás subirlos después desde tu perfil.</p>
												<DocumentosFundacion onSeleccion={setDocumentos} />
											</div>
										</>
									)}

									{error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-bold">{error}</div>}

									<div className="mt-4 flex items-center justify-between">
										<label className="flex items-center gap-2 text-sm text-[#475569]">
											<input type="checkbox" required className="h-4 w-4" /> Acepto el Código Ético de Transparencia de 7:34 AM
										</label>
										<button type="submit" disabled={loading} className="rounded-lg bg-[#0f74a8] px-6 py-3 text-sm font-bold text-white cursor-pointer disabled:opacity-50">
											{loading ? 'Procesando...' : 'Completar registro →'}
										</button>
									</div>
								</form>
							</section>
                        </div>
						{/* Right: Sidebar (mockup panel) - INTACTO */}
						<aside className="max-w-[360px]">
							<div className="rounded-3xl bg-[#DCE9FF] p-6 shadow-sm border border-transparent w-full max-w-[360px]">
								<div className="flex items-start gap-3">
									<div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#007bb9] shadow-sm">
                                        <Icon name="seguridad" size={16} className="text-[#006194]" />
                                    </div>
									<div>
										<div className="text-xs font-bold uppercase text-[#94a3b8]">GARANTÍA 7:34 AM</div>
										<h3 className="mt-2 text-lg font-extrabold text-[#071d37]">¿Por qué registrarte hoy?</h3>
									</div>
								</div>

								<div className="mt-4 space-y-3">
									<div className="rounded-xl bg-white p-4 shadow-sm">
										<div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-full bg-[#e8fff0] flex items-center justify-center text-[#047857]">
                                                <div className="h-7 w-18 rounded-full bg-[#eef6ff] flex items-center justify-center text-[#005684]">
                                                    <Icon name="completado" size={16} className="text-[#006194]" />
                                                </div>
                                            </div>
											<div>
												<p className="font-bold text-sm text-[#0b2a3a]">Fundaciones verificadas</p>
												<p className="mt-1 text-xs text-[#64748b]">Revisamos el RUT, la Cámara de Comercio y la personería jurídica de cada fundación antes de aprobarla.</p>
											</div>
										</div>
									</div>

									<div className="rounded-xl bg-white p-4 shadow-sm">
										<div className="flex items-start gap-3">
											<div className="h-9 w-9 rounded-full bg-[#e8fff0] flex items-center justify-center text-[#047857]">
                                                <div className="h-7 w-18 rounded-full bg-[#eef6ff] flex items-center justify-center text-[#005684]">
                                                    <Icon name="trayectoria" size={16} className="text-[#006947]" />
                                                </div>
                                            </div>
											<div>
												<p className="font-bold text-sm text-[#0b2a3a]">Seguimiento transparente</p>
												<p className="mt-1 text-xs text-[#64748b]">Cada peso donado y cada hora trabajada cuenta con métricas públicas, bitácoras fotográficas y recibos auditables.</p>
											</div>
										</div>
									</div>

									<div className="rounded-xl bg-white p-4 shadow-sm">
										<div className="flex items-start gap-3">
											<div className="h-9 w-9 rounded-full bg-[#f3f2ff] flex items-center justify-center text-[#553c9a]">
                                                <div className="h-7 w-18 rounded-full bg-[#eef6ff] flex items-center justify-center text-[#005684]">
                                                <Icon name="donar" size={16} className="text-[#5C647A]" />
                                            </div>
                                            </div>
											<div>
												<p className="font-bold text-sm text-[#0b2a3a]">Conexión sin intermediarios</p>
												<p className="mt-1 text-xs text-[#64748b]">Contacto directo entre los coordinadores en territorio y las personas dispuestas a transformar realidades.</p>
											</div>
										</div>
									</div>

									<div className="rounded-xl bg-[#0f2a3f] p-4 shadow-sm mt-2">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-xs font-bold text-[#94a3b8]">ASIGNACIÓN DIRECTA</p>
												<p className="mt-1 text-2xl font-extrabold text-[#9ef0c9]">96.4%<span className="ml-2 text-xs text-[#94a3b8] block">Recursos en territorio</span></p>
											</div>
											<div className="h-10 w-10 rounded-full bg-[#0f3f4f33] flex items-center justify-center text-[#9ef0c9]">
                                                <Icon name="formulario" size={16} className="text-[#6FFBBE]" />
                                            </div>
										</div>
									</div>
								</div>
                            </div>
                            
							<div className="rounded-xl bg-white p-5 shadow-sm mt-3 border border-gray-100">
								<div className="flex items-center gap-3 mb-3">
									<img src="https://i.pravatar.cc/40?img=5" alt="Carolina Restrepo" className="h-9 w-9 rounded-full object-cover shadow-sm" />
									<div className="flex flex-col">											    
										<p className="m-0 text-sm font-bold text-[#0b2a3a] leading-tight">Carolina Restrepo</p>
										<span className="text-xs text-slate-500 capitalize">Líder Comunitaria • Medellín</span>
									</div>
								</div>
								<div className="text-[12px] italic text-slate-600 rounded-lg">
									<p className="m-0 leading-relaxed">"En 7:34 AM encontramos una plataforma seria donde los voluntarios no vienen por foto sino por verdadera vocación de servicio. La transparencia de NIT nos abrió puertas con grandes donantes."</p>
								</div>
                            </div>
						</aside>
				    </div>
				</div>
			</main>
		</div>
	);
}