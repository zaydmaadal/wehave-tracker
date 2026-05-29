import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { Building2, Euro, CalendarDays, Plus, CheckCircle2, Clock, Zap, Target } from 'lucide-react';

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  
  // 1. Haal de data op
  const { data: sponsors, error } = await supabase
    .from('sponsors')
    .select('*')
    .order('created_at', { ascending: false });

  // 2. Bereken echte business metrics
  const totalValue = sponsors?.reduce((sum, sponsor) => sum + (Number(sponsor.deal_value) || 0), 0) ?? 0;
  const activeDeals = sponsors?.filter(s => s.status?.toLowerCase() === 'actief' || s.status?.toLowerCase() === 'active').length ?? 0;

  // 3. De Next.js Server Action (Dit is de magie om data toe te voegen!)
  async function addSponsor(formData: FormData) {
    'use server';
    const supabaseServer = await createClient();
    
    const newSponsor = {
      company_name: formData.get('companyName'),
      deal_value: Number(formData.get('dealValue')),
      status: formData.get('status'),
      rights_included: formData.get('rights'),
      contract_end: formData.get('contractEnd'),
    };

    const { error } = await supabaseServer.from('sponsors').insert(newSponsor);
    
    if (!error) {
      revalidatePath('/'); // Ververs de pagina data direct zonder reload
    }
  }

  const getStatusStyle = (status: string | null) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('active') || s.includes('actief')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('pending') || s.includes('onderhandeling')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  if (error) return <div className="p-10 text-red-500">Database Fout: {error.message}</div>;

  return (
    <main className="min-h-screen bg-[#F4F4F5] font-sans text-slate-900 selection:bg-blue-200">
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">wijHebben<span className="text-blue-600">.</span></span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Dashboard</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Contracten</span>
            <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10">
        
        {/* Real Metrics Header */}
        <section className="mb-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between text-slate-500">
              <p className="text-sm font-semibold uppercase tracking-wider">Totale Pijplijn</p>
              <Euro size={18} className="text-blue-500" />
            </div>
            <p className="mt-4 text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              €{totalValue.toLocaleString('nl-BE')}
            </p>
          </div>
          
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between text-slate-500">
              <p className="text-sm font-semibold uppercase tracking-wider">Actieve Deals</p>
              <Target size={18} className="text-emerald-500" />
            </div>
            <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">{activeDeals}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
             <div className="flex items-center justify-between text-slate-500">
              <p className="text-sm font-semibold uppercase tracking-wider">Totale Partners</p>
              <Building2 size={18} className="text-indigo-500" />
            </div>
            <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">{sponsors?.length ?? 0}</p>
          </div>
        </section>

        {/* Main Dashboard Layout: Split View */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Left Column: Data List (Takes up 8 columns) */}
          <section className="lg:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Recente Contracten</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              {!sponsors || sponsors.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                  <p className="text-slate-500 font-medium">Je pijplijn is leeg. Voeg rechts een deal toe.</p>
                </div>
              ) : (
                sponsors.map((sponsor) => (
                  <article key={sponsor.id} className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:items-center">
                    
                    {/* Subtiel kleureffect aan de linkerkant bij hover */}
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"></div>

                    <div className="mb-4 sm:mb-0">
                      <h3 className="text-lg font-bold text-slate-900">{sponsor.company_name}</h3>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <Euro size={14} /> 
                        <span className="font-semibold text-slate-700">{sponsor.deal_value?.toLocaleString('nl-BE')}</span>
                        <span className="mx-2 h-1 w-1 rounded-full bg-slate-300"></span>
                        <span className="truncate max-w-[200px]">{sponsor.rights_included}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusStyle(sponsor.status)}`}>
                        {sponsor.status}
                      </span>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <CalendarDays size={14} />
                        {sponsor.contract_end}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Right Column: Add Form (Takes up 4 columns) */}
          <section className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="mb-6">
                <h2 className="text-lg font-bold tracking-tight">Nieuwe Deal Toevoegen</h2>
                <p className="text-sm text-slate-500">Sla direct op in Supabase.</p>
              </div>

              <form action={addSponsor} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Bedrijfsnaam</label>
                  <input required name="companyName" type="text" placeholder="Bv. Nike, Red Bull..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10" />
                </div>
                
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Deal Waarde (€)</label>
                  <input required name="dealValue" type="number" placeholder="5000" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
                  <select name="status" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10">
                    <option value="In Onderhandeling">In Onderhandeling</option>
                    <option value="Actief">Actief</option>
                    <option value="Verlopen">Verlopen</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Rechten & Extra's</label>
                  <input required name="rights" type="text" placeholder="Bord langs veld, 4 VIP tickets" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Einddatum Contract</label>
                  <input required name="contractEnd" type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10" />
                </div>

                <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98]">
                  <Plus size={18} />
                  Deal Opslaan
                </button>
              </form>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}