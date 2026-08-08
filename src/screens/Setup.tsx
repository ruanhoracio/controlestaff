export default function Setup() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-panel max-w-lg w-full p-8">
        <p className="eyebrow mb-3">Configuração pendente</p>
        <h1 className="text-2xl font-light tracking-tight text-slate-950 mb-4">Conecte o banco de dados</h1>
        <p className="text-sm leading-6 text-slate-600 font-light mb-6">
          O app guarda os dados online no Supabase. Falta preencher as credenciais do projeto no arquivo{' '}
          <code className="font-mono text-xs text-blue-600">.env.local</code> na raiz do projeto:
        </p>
        <pre className="rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs p-5 overflow-x-auto leading-6">
{`VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA-CHAVE-ANON`}
        </pre>
        <p className="mt-6 text-xs leading-5 text-slate-400 font-light">
          O passo a passo completo (criar o projeto, rodar o schema SQL e criar o login) está no README.md.
          Depois de preencher, reinicie o servidor de desenvolvimento.
        </p>
      </div>
    </div>
  )
}
