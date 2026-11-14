from common import *

def vazio(ic, t, sub, cta):
    return (f'<div style="padding: 32px 20px; border-radius: 12px; background: {C}; border: 1px solid {LN}; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px">'
            f'<div aria-hidden="true" style="width: 56px; height: 56px; border-radius: 999px; background: {TS}; color: {TP}; display: flex; align-items: center; justify-content: center">{icon(ic, 28)}</div>'
            f'<div style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">{t}</div><div style="{SM}; max-width: 280px">{sub}</div>{cta}</div>')
vazios = col(lbl('Loja') + vazio('sacola', 'Sua sacola está vazia', 'Os produtos que você adicionar aparecem aqui.', btn('Ver produtos'))
             + lbl('Gestão') + vazio('pedidos', 'Nenhum pedido pendente', 'Quando chegar um pedido novo, ele aparece aqui na hora.', btn('Ver pedidos concluídos', 's'))
             + lbl('Busca sem resultado') + vazio('buscar', 'Nada encontrado para “cuscuz”', 'Confira a escrita ou procure por categoria.', btn('Ver categorias', 's')), 10)

sk = lambda w, h=14, r=6: f'<div style="width: {w}; height: {h}px; border-radius: {r}px; background: {LN}"></div>'
linha = (f'<div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {LN}"><div style="flex: none; width: 48px; height: 48px; border-radius: 10px; background: {LN}"></div>'
         f'<div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 8px">{sk("70%")}{sk("40%", 12)}</div>{sk("56px", 16)}</div>')
carreg = col(lbl('Lista · esqueleto no formato do conteúdo')
             + f'<div role="status" aria-label="Carregando lista" style="padding: 4px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}">' + linha.replace(f'border-top: 1px solid {LN}', 'border-top: 0', 1) + linha * 3 + '</div>'
             + lbl('Indicadores')
             + grid(2, ''.join(f'<div style="padding: 14px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 10px">{sk("60%", 12)}{sk("80%", 22)}{sk("50%", 10)}</div>' for _ in range(2)), 8)
             + lbl('Ação em andamento')
             + btn('Confirmando recebimento…', 'p', 56, 'width: 100%', f'<span aria-hidden="true" style="width: 18px; height: 18px; border-radius: 999px; border: 2px solid rgba(255,255,255,0.45); border-top-color: {W}; box-sizing: border-box"></span>')
             + f'<div style="{SM}">Esqueleto para carregar telas; indicador no próprio botão para ações. Sem tela inteira bloqueada.</div>', 10)

erro_tela = (f'<div role="alert" style="padding: 32px 20px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px">'
             f'<div aria-hidden="true" style="width: 56px; height: 56px; border-radius: 999px; background: {ER_B}; color: {ER_T}; display: flex; align-items: center; justify-content: center">{icon("alerta", 28)}</div>'
             f'<div style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">Não foi possível carregar o estoque</div><div style="{SM}; max-width: 280px">Verifique a conexão e tente de novo. Nada foi alterado.</div>{btn("Tentar de novo")}</div>')
faixa = lambda ic, t, fg, bg: f'<div role="status" style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; background: {bg}; color: {fg}; font-size: 14px; line-height: 20px; font-weight: 500">{icon(ic, 20)}<span>{t}</span></div>'
erros = col(lbl('Falha ao carregar') + erro_tela
            + lbl('Faixas de aviso')
            + faixa('sem-conexao', 'Sem conexão. Tentando reconectar…', G, AT_B)
            + faixa('alerta', 'Estoque insuficiente: há 3 un de Tapioca e a venda pede 5.', ER_T, ER_B)
            + faixa('confirmar', 'Recebimento confirmado. Estoque atualizado.', OK_T, OK_B)
            + lbl('Erro no campo')
            + f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="e1" style="font-size: 14px; line-height: 20px; font-weight: 600">Quantidade recebida</label>'
              f'<input id="e1" type="text" value="-2" aria-invalid="true" aria-describedby="e1m" style="height: 48px; padding: 0 14px; border-radius: 8px; border: 2px solid {ER_T}; background: {W}; color: {G}; font: 400 16px {FB}; box-sizing: border-box; width: 100%; outline: none">'
              f'<div id="e1m" style="font-size: 13px; line-height: 18px; color: {ER_T}; display: flex; gap: 6px; align-items: center">{icon("alerta", 16)}Informe um número igual ou maior que zero.</div></div>', 10)

body = grid(3, sec('Vazio', 'Diz o que vai aparecer ali e oferece o próximo passo.', vazios)
            + sec('Carregando', 'Mantém o lugar do conteúdo para a tela não pular.', carreg)
            + sec('Erro e avisos', 'Diz o que houve, o que não mudou e como seguir.', erros), 24)

page('DS-Estados.dc.html', 'Bodeleve — design system: estados', 'Etapa 2 · Design system · 5 de 5', 'Estados',
     'Toda lista e toda ação têm estado vazio, de carregamento e de erro definidos antes das telas.',
     f'<b style="color: {G}">Tom de voz.</b> Frases curtas, sem culpa para quem usa, sempre com o próximo passo.', body, 1440, 1560)
