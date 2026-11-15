from common import *

def bar(items, active=0):
    cells = ''
    for i, (ic, t) in enumerate(items):
        on = i == active
        cur = 'aria-current="page" ' if on else ''
        cells += (f'<a href="#" {cur}style="flex: 1 1 0; min-width: 0; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; '
                  f'text-decoration: none; color: {T if on else G2}; font-size: 12px; line-height: 16px; font-weight: {700 if on else 500}">{icon(ic)}<span>{t}</span></a>')
    return f'<nav aria-label="Navegação principal" style="display: flex; background: {W}; border-top: 1px solid {LN}">{cells}</nav>'

def frame(inner, bg=OP, h=None):
    hh = f'height: {h}px; ' if h else ''
    return f'<div style="width: 390px; max-width: 100%; {hh}box-sizing: border-box; border: 1px solid {LN}; border-radius: 20px; overflow: hidden; background: {bg}; display: flex; flex-direction: column">{inner}</div>'

def env(letter, name, note, inner):
    return col(f'<div style="display: flex; gap: 10px; align-items: baseline"><b style="font-family: {FD}; font-size: 20px; line-height: 24px">{letter} · {name}</b></div><div style="{SM}; min-height: 40px">{note}</div>{inner}', 8)

spacer = f'<div style="flex: 1 1 0; min-height: 56px; display: flex; align-items: center; justify-content: center; color: {G2}; font-size: 13px">conteúdo da tela</div>'
sacola = (f'<a href="#" style="margin: 0 12px 12px; height: 56px; padding: 0 16px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: flex; align-items: center; gap: 12px; font-weight: 600">'
          f'{icon("sacola")}<span style="flex: 1 1 0">Ver sacola · 3 itens</span><span style="font-variant-numeric: tabular-nums">R$ 86,40</span></a>')

barras = grid(4, ''.join([
    env('C', 'Loja online', 'Sacola aparece como barra fixa quando há itens.', frame(spacer + sacola + bar([('inicio', 'Início'), ('buscar', 'Buscar'), ('pedidos', 'Pedidos'), ('perfil', 'Perfil')]), C, 200)),
    env('A', 'Gestão', '“Mais” abre o hub com os outros módulos.', frame(spacer + bar([('inicio', 'Início'), ('pedidos', 'Pedidos'), ('estoque', 'Estoque'), ('financeiro', 'Financeiro'), ('mais', 'Mais')]), OP, 200)),
    env('B', 'PDV', 'Some durante o pagamento.', frame(spacer + bar([('vender', 'Vender'), ('historico', 'Vendas'), ('caixa', 'Caixa')]), OP, 200)),
    env('D', 'Entregas', 'Some durante a entrega em rota.', frame(spacer + bar([('entregas', 'Entregas'), ('historico', 'Histórico'), ('perfil', 'Perfil')]), OP, 200)),
]), 24)

topo = (f'<div style="display: flex; align-items: center; gap: 4px; height: 56px; padding: 0 4px; background: {W}; border-bottom: 1px solid {LN}">'
        f'<button type="button" aria-label="Voltar" style="width: 48px; height: 48px; border: 0; background: transparent; color: {G}; display: inline-flex; align-items: center; justify-content: center">{icon("voltar")}</button>'
        f'<div style="flex: 1 1 0; font-family: {FD}; font-weight: 700; font-size: 18px; line-height: 24px">Recebimento</div>'
        f'<button type="button" aria-label="Buscar" style="width: 48px; height: 48px; border: 0; background: transparent; color: {G}; display: inline-flex; align-items: center; justify-content: center">{icon("buscar")}</button></div>')
def tabs(items, active=0):
    return (f'<div role="tablist" style="display: flex; background: {W}; border-bottom: 1px solid {LN}">'
            + ''.join(f'<button type="button" role="tab" aria-selected="{"true" if i == active else "false"}" style="flex: 1 1 0; height: 48px; border: 0; background: transparent; border-bottom: 3px solid {T if i == active else "transparent"}; color: {G if i == active else G2}; font: {700 if i == active else 500} 14px {FB}">{t}</button>' for i, t in enumerate(items)) + '</div>')
seg = (f'<div style="padding: 12px"><div role="group" aria-label="Lista de entregas" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 4px; border-radius: 12px; background: {C}; border: 1px solid {LN}">'
       f'<button type="button" aria-pressed="true" style="height: 44px; border: 0; border-radius: 8px; background: {W}; color: {G}; font: 600 14px {FB}; box-shadow: 0 1px 2px rgba(41,38,33,0.12)">Disponíveis · 4</button>'
       f'<button type="button" aria-pressed="false" style="height: 44px; border: 0; border-radius: 8px; background: transparent; color: {G2}; font: 600 14px {FB}">Minhas · 1</button></div></div>')
c1 = col(lbl('Barra superior') + frame(topo) + lbl('Abas · PDV') + frame(tabs(['Favoritos', 'Categorias', 'Buscar'])) + lbl('Segmentos · Entregas') + frame(seg), 10)

chip = lambda t, on=False: f'<button type="button" style="height: 44px; padding: 0 14px; border-radius: 999px; border: 1.5px solid {G if on else LN}; background: {G if on else W}; color: {W if on else G}; font: 600 14px {FB}">{t}</button>'
sheet = (f'<div style="width: 390px; max-width: 100%; box-sizing: border-box; border: 1px solid {LN}; border-radius: 20px; overflow: hidden; background: rgba(41,38,33,0.45); display: flex; flex-direction: column; justify-content: flex-end; padding-top: 72px">'
         f'<div role="dialog" aria-label="Informar peso" style="background: {W}; border-radius: 20px 20px 0 0; padding: 12px 20px 20px; display: flex; flex-direction: column; gap: 16px">'
         f'<div aria-hidden="true" style="align-self: center; width: 40px; height: 4px; border-radius: 999px; background: {LN}"></div>'
         f'<div><div style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">Carne de sol</div><div style="{SM}; font-variant-numeric: tabular-nums">R$ 59,90 / kg</div></div>'
         f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="sp" style="font-size: 14px; line-height: 20px; font-weight: 600">Peso</label>'
         f'<div style="display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 16px; border-radius: 8px; border: 2px solid {G}"><input id="sp" type="text" inputmode="decimal" value="0,500" style="flex: 1 1 0; min-width: 0; border: 0; background: transparent; font: 600 22px {FB}; color: {G}; font-variant-numeric: tabular-nums; outline: none"><span style="color: {G2}; font-weight: 600">kg</span></div></div>'
         f'<div style="display: flex; gap: 8px">{chip("250 g")}{chip("500 g", True)}{chip("1 kg")}</div>'
         + btn('Adicionar · R$ 29,95', 'p', 56, 'width: 100%; font-variant-numeric: tabular-nums') + '</div></div>')
c2 = col(lbl('Bottom sheet · escolha curta') + sheet + f'<div style="{SM}">Fecha ao arrastar para baixo, ao tocar fora e com o botão voltar. Nunca para confirmação crítica nem para vários passos.</div>', 10)

modal = (f'<div style="width: 390px; max-width: 100%; box-sizing: border-box; border: 1px solid {LN}; border-radius: 20px; background: rgba(41,38,33,0.45); padding: 32px 24px">'
         f'<div role="alertdialog" aria-labelledby="mt" style="background: {W}; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 12px">'
         f'<div id="mt" style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">Cancelar esta venda?</div>'
         f'<div style="{SM}">Os 3 itens da sacola serão removidos. Esta ação não pode ser desfeita.</div>'
         f'<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px">{btn("Cancelar venda", "d", 48, "width: 100%")}{btn("Continuar vendendo", "s", 48, "width: 100%")}</div></div></div>')
toast = (f'<div role="status" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; background: {G}; color: {C}; font-size: 14px; line-height: 20px">'
         f'{icon("confirmar", 20)}<span style="flex: 1 1 0">Produto adicionado à sacola</span><button type="button" style="border: 0; background: transparent; color: {M}; font: 600 14px {FB}; min-height: 32px">Desfazer</button></div>')
c3 = col(lbl('Modal · confirmação crítica') + modal + lbl('Aviso temporário') + toast, 10)

mods = [('inicio', 'Início', True), ('pedidos', 'Vendas e pedidos', False), ('estoque', 'Estoque', False), ('financeiro', 'Financeiro', False), ('compras', 'Compras', False),
        ('entregas', 'Fornecedores', False), ('producao', 'Produção', False), ('vender', 'Produtos', False), ('perfil', 'Clientes', False), ('local', 'Entregas', False),
        ('historico', 'Relatórios', False), ('mais', 'Configurações', False)]
rail = (f'<nav aria-label="Menu lateral" style="width: 260px; box-sizing: border-box; padding: 16px 12px; border: 1px solid {LN}; border-radius: 20px; background: {W}; display: flex; flex-direction: column; gap: 2px">'
        f'<div style="padding: 4px 12px 12px; font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 28px">Bodeleve</div>'
        + ''.join(f'<a href="#" style="display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 12px; border-radius: 10px; text-decoration: none; background: {TS if on else "transparent"}; color: {TP if on else G}; font-size: 15px; font-weight: {600 if on else 500}">{icon(ic, 20)}<span>{t}</span></a>' for ic, t, on in mods) + '</nav>')
c4 = col(lbl('Gestão em tablet e desktop') + rail + f'<div style="{SM}">A partir de 768 px a barra inferior vira menu lateral com os 12 módulos.</div>', 10)

body = (sec('Barra inferior por ambiente', '3 a 5 destinos de mesmo peso, com ícone e rótulo. Destino ativo em terracota e negrito — cor e peso juntos.', barras)
        + sec('Estrutura de tela e sobreposições', 'Sheet para escolhas curtas; tela cheia ou modal para o que é crítico.', grid(4, c1 + c2 + c3 + c4, 24)))

page('DS-Navegacao.dc.html', 'Bodeleve — design system: navegação', 'Etapa 2 · Design system · 3 de 5', 'Navegação e sobreposições',
     'Barras inferiores dos quatro ambientes, barra superior, abas, bottom sheet, modal e menu lateral. Molduras de 390 px.',
     f'<b style="color: {G}">Regra.</b> A barra inferior some em tarefas focadas: checkout, pagamento e entrega em rota.', body, 1760, 1800)
