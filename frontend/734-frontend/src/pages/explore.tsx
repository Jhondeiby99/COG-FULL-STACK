import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import * as Icons from '../assets/icons/index.ts';

export function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(true);
  const tabUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'fundaciones' | 'voluntarios'>(
    tabUrl === 'voluntarios' ? 'voluntarios' : 'fundaciones'
  );
  // Si cambia ?tab= estando ya en esta página (p. ej. desde el footer), se sincroniza la pestaña
  const [tabUrlPrevia, setTabUrlPrevia] = useState(tabUrl);
  if (tabUrl !== tabUrlPrevia) {
    setTabUrlPrevia(tabUrl);
    if (tabUrl === 'voluntarios' || tabUrl === 'fundaciones') setActiveTab(tabUrl);
  }
  
  const [fundaciones, setFundaciones] = useState<any[]>([]);
  const [voluntarios, setVoluntarios] = useState<any[]>([]);

  // Búsqueda global en Supabase cada vez que cambia el parámetro "q"
  useEffect(() => {
    async function performSearch() {
      setLoading(true);
      
      const q = query.trim();
      
      if (q.length === 0) {
        // Si no hay búsqueda, traemos los más recientes
        const [fundRes, volRes] = await Promise.all([
          supabase.from('fundaciones').select('*').eq('estado', 'aprobada').limit(12),
          supabase.from('voluntarios').select('*').eq('is_verified', true).limit(12)
        ]);
        setFundaciones(fundRes.data || []);
        setVoluntarios(volRes.data || []);
      } else {
        // Búsqueda por coincidencias (ilike)
        const [fundRes, volRes] = await Promise.all([
          supabase.from('fundaciones').select('*').eq('estado', 'aprobada').ilike('nombre_legal', `%${q}%`),
          supabase.from('voluntarios').select('*').eq('is_verified', true).ilike('nombre_completo', `%${q}%`)
        ]);
        setFundaciones(fundRes.data || []);
        setVoluntarios(volRes.data || []);
        
        // Autoseleccionar la pestaña que tenga resultados si la actual está vacía
        if (fundRes.data?.length === 0 && volRes.data && volRes.data.length > 0) {
          setActiveTab('voluntarios');
        } else {
          setActiveTab('fundaciones');
        }
      }
      
      setLoading(false);
    }

    performSearch();
    window.scrollTo(0, 0);
  }, [query]);

  const handleSearchUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({ q: e.target.value });
  };

  const getAvatarUrl = (url?: string | null) => url && url.trim() !== '' ? url : 'https://i.pravatar.cc/150';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
      <Header 
        searchValue={query}
        onSearchChange={handleSearchUpdate}
        searchPlaceholder="Buscar en el directorio..."
      />

      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 md:px-8 py-8 md:py-12">
        
        {/* Cabecera de Búsqueda */}
        <div className="mb-8">
          <Link to="/" className="text-sm font-bold text-[#005684] hover:underline mb-4 inline-block">← Volver al inicio</Link>
          <h1 className="text-3xl font-extrabold text-[#071d37]">
            {query ? (
              <>Resultados para <span className="text-[#005684]">"{query}"</span></>
            ) : (
              'Explorar Directorio'
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Hemos encontrado {fundaciones.length} fundaciones y {voluntarios.length} voluntarios.
          </p>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button 
            onClick={() => setActiveTab('fundaciones')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'fundaciones' ? 'border-[#005684] text-[#005684]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Fundaciones ({fundaciones.length})
          </button>
          <button 
            onClick={() => setActiveTab('voluntarios')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'voluntarios' ? 'border-[#005684] text-[#005684]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Voluntarios ({voluntarios.length})
          </button>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="text-[#005684] font-bold">Buscando en el directorio...</span>
          </div>
        ) : (
          <div>
            {/* VISTA FUNDACIONES */}
            {activeTab === 'fundaciones' && (
              fundaciones.length === 0 ? (
                <div className="text-center bg-white p-10 rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-gray-500 font-medium">No se encontraron fundaciones con ese término.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fundaciones.map(f => (
                    <div key={f.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start gap-4 mb-4">
                        <img src={getAvatarUrl(f.logo_url)} className="w-16 h-16 rounded-xl object-cover border border-gray-100" alt="Logo" />
                        <div>
                          <h3 className="font-extrabold text-[#071d37] leading-tight">{f.nombre_legal}</h3>
                          <p className="text-xs text-gray-500 mt-1">📍 {f.ubicacion || 'Colombia'}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{f.descripcion || 'Sin descripción disponible.'}</p>
                      <Link to={`/fundacion/${f.id}`}>
                        <button className="w-full py-2.5 bg-[#f0f9ff] text-[#005684] font-bold text-xs rounded-xl hover:bg-[#e0f2fe] transition">Ver perfil completo</button>
                      </Link>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* VISTA VOLUNTARIOS */}
            {activeTab === 'voluntarios' && (
              voluntarios.length === 0 ? (
                <div className="text-center bg-white p-10 rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-gray-500 font-medium">No se encontraron voluntarios con ese término.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {voluntarios.map(v => (
                    <div key={v.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start gap-4 mb-4">
                        <img src={getAvatarUrl(v.avatar_url)} className="w-16 h-16 rounded-full object-cover border border-gray-100" alt="Avatar" />
                        <div>
                          <h3 className="font-extrabold text-[#071d37] flex items-center gap-1">
                            {v.nombre_completo}
                            <img src={Icons.IconVerify} className="w-4 h-4" alt="Verificado"/>
                          </h3>
                          <p className="text-xs font-bold text-emerald-600 mt-1 uppercase">{v.profesion || 'Voluntario Activo'}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{v.sobre_mi || 'Ayuda comunitaria general.'}</p>
                      <Link to={`/voluntario/${v.id}`}>
                        <button className="w-full py-2.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition">Ver perfil completo</button>
                      </Link>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}