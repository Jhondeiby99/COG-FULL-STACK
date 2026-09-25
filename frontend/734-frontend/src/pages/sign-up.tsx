import { useState } from 'react';
import  EdificionIcon from '../assets/icons/EdificionIconWhite.svg'
import  ManoIcon3 from '../assets/icons/ManoIcon3.svg'
import  CheckIcon from '../assets/icons/CheckIcon.svg'
import  ArrowRightIcon from '../assets/icons/ArrowRightIcon.svg'
import  GarantiaIcon from '../assets/icons/GarantiaIcon.svg'
import  CheckVerifyIcon from '../assets/icons/CheckVerifyIcon.svg'
import  SeguimientoIcon from '../assets/icons/SeguimientoIcon.svg'
import  ManoIcon4 from '../assets/icons/ManoIcon4.svg'
import  HojaIcon from '../assets/icons/HojaIcon.svg'
import { Link } from 'react-router-dom';

export function SignUp() {
	const [areas] = useState([
		'Educación & Infancia',
		'Seguridad Alimentaria',
		'Salud Comunitaria',
		'Medio Ambiente & Siembra',
		'Refugio & Hábitat',
	]);

	return (
		<div className="flex min-h-svh w-full flex-col bg-[#f6f9fb] text-left text-[15px] leading-normal text-[#23343f] font-sans">
			

			<main className="flex-1 py-10">
				<div className="mx-auto w-full max-w-[1240px] px-4">
                    <div> {/* DIV AL INICIO */}
                        <div className='flex w-full justify-between'>
                            <div className="flex gap-3 items-center mb-4">
                                <p className='bg-[#DCE9FF] rounded-full px-2 py-1 font-bold text-[#006194] text-[11px]'>MEMBRESÍA 7:34 AM</p>
                                <p className='bg-[#213145] rounded-full px-2 py-1 font-bold text-white text-[11px]'>07:34 AM COT</p>
                            </div>
                            <div className="flex gap-1 items-center mb-4">
                                <p className='font-[500] text-[#3F4850] text-[12px]'>¿Ya tienes una cuenta activa?</p>
                                <Link
                                 to="/login">
                                    <p className=' font-[600] text-[#006194] text-[16px]'>Iniciar Sesión</p>
                                </Link>
                            </div>
                        </div>
                    </div> {/* DIV AL FINAL */}

					<div className="grid gap-8 lg:grid-cols-[2fr_360px]">
						<div>
							<div className='bg-white p-8 mb-4 rounded-xl'>
								<div className="mb-6 flex items-center justify-between">
									<div>
										<span className="inline-block px-1 text-[11px] text-[#071d37]">PASO 01 · PERFIL DE INGRESO</span>
										<h1 className="mt-0 px-1 text-[32px] font-bold text-[#071d37]">Selecciona tu modalidad de participación</h1>
										<p className="mt-0 px-1 text-[14px] text-[#64748b]">Elige tu rol en el ecosistema para adaptar los requerimientos legales, verificación de antecedentes y
											herramientas de gestión comunitaria.</p>
									</div>
								</div>

								<div className="mb-6 grid gap-6 md:grid-cols-3 items-center">
									{/* Selected option: Fundación */}
									<button className="relative blox items-start gap-4 rounded-2xl bg-[#DCE9FF] p-5 shadow-md border border-[#d6eaf9]">
                                        <div className="flex justify-between">
                                            <div className="rounded-lg h-[48px] p-3 bg-[#006194]">
                                                <img src={EdificionIcon}></img>                                        
                                            </div>
                                            <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#006194]">
                                                <div className="flex h-[8px] w-[11px] items-center justify-center">
                                                    <img height="8" width="11" src={CheckIcon} alt="Check" />
                                                </div>
                                            </div>
                                        </div>
										<div className="text-left">
											<div className="text-xl font-[600] text-[#073044]">Soy una Fundación</div>
											<div className="mt-1 text-xs text-[#64748b]">Publica necesidades de tu comunidad y gestiona institucionalmente.</div>
											<div className="mt-3 flex items-center gap-1">
                                                <span className="text-xs text-[#0b76a8] font-bold">
                                                    Gestion institucional & NIT
                                                </span>
                                                <img src={ArrowRightIcon} alt="Flecha" className="h-2 w-2 object-contain" />
                                            </div>
										</div>
									</button>

									{/* Selected option: Fundación */}
									<button className="relative blox items-start gap-4 rounded-2xl bg-transparent p-5 ">
                                        <div className="flex justify-between">
                                            <div className="rounded-lg h-[48px] p-3 bg-[#DCE9FF]">
                                                <img src={ManoIcon3}></img>                                        
                                            </div>
                                            <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#DCE9FF]">                                               
                                            </div>
                                        </div>
										<div className="text-left">
											<div className="text-xl font-[600] text-[#073044]">Quiero ser Voluntario / Donante</div>
											<div className="mt-1 text-xs text-[#64748b]">Ofrece tus talentos, tiempo, horas de voluntariado y
                                            apoya causas verificadas.</div>
                                            <div className="mt-3 flex items-center gap-1">
                                                <span className="text-xs text-[#0b76a8] font-bold">
                                                    Perfil personal e impacto
                                                </span>
                                                <img src={ArrowRightIcon} alt="Flecha" className="h-2 w-2 object-contain" />
                                            </div>
										</div>
									</button>

									<div className="hidden md:block" />
								</div>
							</div>

							<div className="rounded-xl bg-white p-4 shadow-sm border border-[#e6eef6] mb-6">
								<div className="flex items-center justify-between">
									<div className="text-sm font-bold text-[#0b2a3a]">Paso 2 de 2: Información institucional y jurídica</div>
									<div className="text-xs text-[#94a3b8]">50% completado</div>
								</div>
								<div className="mt-3 h-2 w-full rounded-full bg-[#e6eef6]">
									<div className="h-full rounded-full bg-[#007bb9]" style={{ width: '50%' }} />
								</div>
							</div>

							{/* Left: Form */}
							<section className="rounded-2xl bg-white p-6 shadow-sm border border-[#e6eef6] md:p-8">
							<div className="mb-4 flex items-center justify-between">
								<h2 className="text-lg font-extrabold text-[#0b2a3a]">Datos de la Organización Sin Ánimo de Lucro</h2>
								<div className="flex items-center gap-3">
									<span className="text-xs font-medium text-[#94a3b8]">50% completado</span>
									<span className="inline-flex items-center rounded-full bg-[#eef8ff] px-3 py-1 text-xs font-bold text-[#0b76a8]">Registro Oficial</span>
								</div>
							</div>

								<form className="flex flex-col gap-4">
									<div className="grid gap-3 md:grid-cols-2">
										<div>
											<label className="text-xs font-bold text-[#475569]">Nombre legal o razón social <span className="text-red-500">*</span></label>
											<input className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm placeholder:text-[#a0aec0] focus:outline-none focus:ring-1 focus:ring-[#cfe8ff]" placeholder="Ej. Fundación Huellas del Porvenir" />
										</div>
										<div>
											<label className="text-xs font-bold text-[#475569]">NIT / Número de Registro Jurídico <span className="text-red-500">*</span></label>
											<input className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm placeholder:text-[#a0aec0] focus:outline-none focus:ring-1 focus:ring-[#cfe8ff]" placeholder="900.123.456-7" />
										</div>
									</div>

									<div className="grid gap-3 md:grid-cols-2">
										<div>
											<label className="text-xs font-bold text-[#475569]">Representante legal / Enlace <span className="text-red-500">*</span></label>
											<input className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm" placeholder="Nombre completo del representante" />
										</div>
										<div>
											<label className="text-xs font-bold text-[#475569]">Teléfono móvil de contacto</label>
											<input className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm" placeholder="+57 (300) 000-0000" />
										</div>
									</div>

									<div className="grid gap-3 md:grid-cols-2">
										<div>
											<label className="text-xs font-bold text-[#475569]">Correo electrónico institucional <span className="text-red-500">*</span></label>
											<input className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm" placeholder="direccion@miorg.org" />
										</div>
										<div>
											<label className="text-xs font-bold text-[#475569]">Comuna / Localidad / Sector</label>
											<input className="mt-1 w-full rounded-xl border border-[#e6eef6] bg-[#fbfdff] px-3.5 py-2 text-sm" placeholder="Ej. Comuna 13 - San Javier" />
										</div>
									</div>

									<div>
										<label className="text-xs font-bold text-[#475569]">Áreas prioritarias de impacto</label>
										<div className="mt-2 flex flex-wrap gap-2">
											{areas.map((a) => (
												<button key={a} type="button" className="flex items-center gap-2 rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#005684]">
													<span className="text-[11px]">🔹</span>
													{a}
												</button>
											))}
										</div>
									</div>

									<div>
										<label className="text-xs font-bold text-[#475569]">Copia digital de Personería Jurídica / RUT / Cámara de Comercio</label>
										<div className="mt-3 rounded-xl border-2 border-dashed border-[#e6eef6] bg-[#eef8ff] p-8 text-center">
											<div className="mx-auto max-w-[520px]">
												<div className="mb-3 text-4xl">☁️</div>
												<p className="mb-2 text-sm text-[#64748b]">Haz clic para adjuntar certificado o arrastra y suelta el documento oficial aquí</p>
												<p className="text-xs text-[#9aa6b2]">PDF, JPG (Max 15MB)</p>
												<div className="mt-4 flex items-center justify-center gap-3">
													<button className="inline-flex items-center justify-center rounded-lg bg-[#005684] px-4 py-2 text-sm font-bold text-white">Adjuntar documento</button>
													<span className="rounded-full bg-[#e6ffef] px-2 py-1 text-xs font-bold text-[#047857]">Encriptado y verificado en 24h</span>
												</div>
											</div>
										</div>
									</div>

									<div className="mt-4 flex items-center justify-between">
										<label className="flex items-center gap-2 text-sm text-[#475569]"><input type="checkbox" className="h-4 w-4" /> Acepto el Código Ético de Transparencia de 7:34 AM</label>
                                        <Link
                                        to="/">
										<button type="submit" className="rounded-lg bg-[#0f74a8] px-6 py-3 text-sm font-bold text-white cursor-pointer">Completar registro →</button>
                                        </Link>
									</div>
								</form>
						</section>
                        </div>
						{/* Right: Sidebar (mockup panel) */}
						<aside className="max-w-[360px]">
							<div className="rounded-3xl bg-[#DCE9FF] p-6 shadow-sm border border-transparent w-full max-w-[360px]">
								<div className="flex items-start gap-3">
									<div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#007bb9] shadow-sm">
                                        <img src={GarantiaIcon} height={16} width={16}></img>
                                    </div>
									<div>
										<div className="text-xs font-bold uppercase text-[#94a3b8]">GARANTÍA 7:34 AM</div>
										<h3 className="mt-2 text-lg font-extrabold text-[#071d37]">¿Por qué registrarte hoy?</h3>
									</div>
								</div>

								<div className="mt-4 space-y-3">
									{/* Card 1 */}
									<div className="rounded-xl bg-white p-4 shadow-sm">
										<div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-full bg-[#e8fff0] flex items-center justify-center text-[#047857]">
                                                <div className="h-7 w-18 rounded-full bg-[#eef6ff] flex items-center justify-center text-[#005684]">
                                                    <img height="16" width="16" src={CheckVerifyIcon}></img>
                                                </div>
                                            </div>
											<div>
												<p className="font-bold text-sm text-[#0b2a3a]">Comunidad 100% verificada</p>
												<p className="mt-1 text-xs text-[#64748b]">Validamos la personería jurídica de cada fundación y la idoneidad ciudadana de cada voluntario.</p>
											</div>
										</div>
									</div>

									{/* Card 2 */}
									<div className="rounded-xl bg-white p-4 shadow-sm">
										<div className="flex items-start gap-3">
											<div className="h-9 w-9 rounded-full bg-[#e8fff0] flex items-center justify-center text-[#047857]">
                                                <div className="h-7 w-18 rounded-full bg-[#eef6ff] flex items-center justify-center text-[#005684]">
                                                    <img height="16" width="16" src={SeguimientoIcon}></img>
                                                </div>
                                            </div>
											<div>
												<p className="font-bold text-sm text-[#0b2a3a]">Seguimiento transparente</p>
												<p className="mt-1 text-xs text-[#64748b]">Cada peso donado y cada hora trabajada cuenta con métricas públicas, bitácoras fotográficas y recibos auditables.</p>
											</div>
										</div>
									</div>

									{/* Card 3 */}
									<div className="rounded-xl bg-white p-4 shadow-sm">
										<div className="flex items-start gap-3">
											<div className="h-9 w-9 rounded-full bg-[#f3f2ff] flex items-center justify-center text-[#553c9a]">
                                                <div className="h-7 w-18 rounded-full bg-[#eef6ff] flex items-center justify-center text-[#005684]">
                                                <img height="16" width="16" src={ManoIcon4}></img>
                                            </div>
                                            </div>
											<div>
												<p className="font-bold text-sm text-[#0b2a3a]">Conexión sin intermediarios</p>
												<p className="mt-1 text-xs text-[#64748b]">Contacto directo entre los coordinadores en territorio y las personas dispuestas a transformar realidades.</p>
											</div>
										</div>
									</div>

									{/* Asignación directa (dark) */}
									<div className="rounded-xl bg-[#0f2a3f] p-4 shadow-sm mt-2">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-xs font-bold text-[#94a3b8]">ASIGNACIÓN DIRECTA</p>
												<p className="mt-1 text-2xl font-extrabold text-[#9ef0c9]">96.4%<span className="ml-2 text-xs text-[#94a3b8] block">Recursos en territorio</span></p>
											</div>
											<div className="h-10 w-10 rounded-full bg-[#0f3f4f33] flex items-center justify-center text-[#9ef0c9]">
                                                <img src={HojaIcon}></img>
                                            </div>
										</div>
									</div>
								</div>
                            </div>
                            {/* Actividad reciente */}
									<div className="rounded-xl bg-white p-5 shadow-sm mt-3 border border-gray-100">
                            {/* Fila del Perfil (Imagen + Textos de identificación) */}
                            <div className="flex items-center gap-3 mb-3">
                                <img 
                                src="https://i.pravatar.cc/40?img=5" 
                                alt="Carolina Restrepo" 
                                className="h-9 w-9 rounded-full object-cover shadow-sm" 
                                />
                                <div className="flex flex-col">											    
                                <p className="m-0 text-sm font-bold text-[#0b2a3a] leading-tight">Carolina Restrepo</p>
                                <span className="text-xs text-slate-500 capitalize">Líder Comunitaria • Medellín</span>
                                </div>
                            </div>

                            {/* Fila del Testimonio (Abajo del perfil para que respire y tenga espacio) */}
                            <div className="text-[12px] italic text-slate-600 rounded-lg">
                                <p className="m-0 leading-relaxed">
                                "En 7:34 AM encontramos una plataforma seria donde los
                                voluntarios no vienen por foto sino por verdadera vocación
                                de servicio. La transparencia de NIT nos abrió puertas con
                                grandes donantes."
                                </p>
                            </div>
                            </div>

							</aside>
					
				    </div>
				</div>
			</main>
		</div>
	);
}

