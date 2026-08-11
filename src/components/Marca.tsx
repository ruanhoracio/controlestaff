import logoClaro from '../assets/logo-hera-claro.svg'
import logoEscuro from '../assets/logo-hera-escuro.svg'

/**
 * Logo do Grupo Hera. O SVG original foi feito para fundo escuro (texto claro),
 * então existe uma variante com o texto em azul-marinho para o tema claro —
 * o emblema dourado é o mesmo nos dois.
 */
export default function Marca({
  escuro,
  tamanho = 'normal',
  comSubtitulo = true,
}: {
  escuro: boolean
  tamanho?: 'normal' | 'compacto' | 'grande'
  comSubtitulo?: boolean
}) {
  const altura = tamanho === 'grande' ? 'h-10' : tamanho === 'compacto' ? 'h-7' : 'h-8'
  return (
    <span className="flex flex-col gap-1.5 min-w-0">
      <img src={escuro ? logoEscuro : logoClaro} alt="Grupo Hera" className={`${altura} w-auto self-start`} />
      {comSubtitulo && (
        <span className="font-mono text-[10px] font-medium tracking-[-0.02em] text-slate-400 uppercase pl-0.5">
          Controle Staff
        </span>
      )}
    </span>
  )
}
