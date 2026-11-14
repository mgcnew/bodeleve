from common import *

NUM = 'font-variant-numeric: tabular-nums'
foto = lambda h: f'<div role="img" aria-label="Espaço para foto do produto" style="height: {h}px; border-radius: 10px; background: {C}; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 12px; line-height: 16px; font-weight: 600; color: {G2}">[FOTO DO PRODUTO]</div>'
addb = f'<button type="button" aria-label="Adicionar à sacola" style="flex: none; width: 44px; height: 44px; border-radius: 12px; border: 0; background: {T}; color: {W}; display: inline-flex; align-items: center; justify-content: center">{icon("adicionar", 20)}</button>'

def pcard(nome, un, preco, selo=''):
    return (f'<article style="padding: 10px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; min-width: 0">{foto(120)}'
            f'<div style="min-height: 24px">{selo}</div>'
            f'<div><div style="font-weight: 600; line-height: 22px">{nome}</div><div style="font-size: 13px; line-height: 18px; color: {G2}">{un}</div></div>'
            f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><div style="font-weight: 600; font-size: 18px; {NUM}">{preco}</div>{addb}</div></article>')

loja = col(lbl('Cartão de produto · loja')
           + grid(2, pcard('Queijo coalho', '500 g', 'R$ 32,90', seal('Feito na casa', V)) + pcard('Rapadura', '400 g', 'R$ 14,50', seal('Marca Bodeleve', T)), 12)
           + lbl('Item na sacola')
           + f'<div style="display: flex; gap: 12px; align-items: center; padding: 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}"><div style="flex: none; width: 64px">{foto(64)}</div>'
             f'<div style="flex: 1 1 0; min-width: 0"><div style="font-weight: 600">Farinha de mandioca</div><div style="font-size: 13px; line-height: 18px; color: {G2}; {NUM}">1 kg · R$ 12,90</div></div>'
             f'<div style="font-weight: 600; {NUM}">× 2</div></div>'
           + lbl('Resumo de valores')
           + f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}">'
             f'<div style="display: flex; justify-content: space-between; color: {G2}"><span>Subtotal</span><span>R$ 73,20</span></div>'
             f'<div style="display: flex; justify-content: space-between; color: {G2}"><span>Entrega (estimada)</span><span>R$ 8,00</span></div>'
             f'<div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid {LN}; font-weight: 600; font-size: 18px"><span>Total</span><span>R$ 81,20</span></div></div>', 10)

def tile(nome, preco, est, warn=False):
    return (f'<button type="button" style="height: 96px; padding: 10px; border-radius: 12px; border: 1px solid {LN}; background: {W}; color: {G}; text-align: left; display: flex; flex-direction: column; justify-content: space-between; font: 400 14px {FB}; min-width: 0">'
            f'<span style="font-weight: 600; line-height: 18px">{nome}</span><span style="display: flex; justify-content: space-between; align-items: baseline; gap: 4px; {NUM}"><span style="font-weight: 600">{preco}</span>'
            f'<span style="font-size: 12px; color: {AT_T if warn else G2}; font-weight: {600 if warn else 400}">{est}</span></span></button>')
pdv = col(lbl('Bloco de favorito · PDV')
          + grid(2, tile('Queijo coalho', '32,90', '18 un') + tile('Carne de sol', '59,90/kg', '6,4 kg') + tile('Tapioca', '9,90', '3 un', True)
                 + tile('Rapadura', '14,50', '24 un') + tile('Manteiga de garrafa', '28,00', '11 un') + tile('Feijão de corda', '16,90/kg', '9 kg'), 8)
          + lbl('Linha da venda')
          + f'<div style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 12px; background: {W}; border: 1px solid {LN}; {NUM}">'
            f'<div style="flex: 1 1 0; min-width: 0"><div style="font-weight: 600">Carne de sol</div><div style="font-size: 13px; line-height: 18px; color: {G2}">0,500 kg × R$ 59,90</div></div><div style="font-weight: 600">R$ 29,95</div></div>'
          + lbl('Forma de pagamento')
          + grid(2, ''.join(f'<button type="button" aria-pressed="{"true" if on else "false"}" style="height: 56px; border-radius: 12px; border: {"2px solid " + G if on else "1.5px solid " + LN}; background: {W}; color: {G}; font: 600 16px {FB}">{t}</button>' for t, on in (('Dinheiro', False), ('Pix', True), ('Débito', False), ('Crédito', False))), 8)
          + lbl('Fechamento de caixa')
          + f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}">'
            f'<div style="display: flex; justify-content: space-between; color: {G2}"><span>Esperado em dinheiro</span><span>R$ 412,00</span></div>'
            f'<div style="display: flex; justify-content: space-between; color: {G2}"><span>Contado</span><span>R$ 407,00</span></div>'
            f'<div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid {LN}; font-weight: 600; color: {ER_T}"><span>Diferença</span><span>− R$ 5,00</span></div></div>', 10)

def kpi(t, v, sub, fg=G):
    return (f'<div style="padding: 14px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 4px; min-width: 0"><div style="font-size: 13px; line-height: 18px; color: {G2}">{t}</div>'
            f'<div style="font-weight: 600; font-size: 20px; line-height: 26px; color: {fg}; {NUM}">{v}</div><div style="font-size: 12px; line-height: 16px; color: {G2}">{sub}</div></div>')
def sal(t, v, strong=False):
    return f'<div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; line-height: 16px; color: {G2}">{t}</span><span style="font-weight: {700 if strong else 500}; {NUM}">{v}</span></div>'
def lote(cod, val, tag):
    return (f'<div style="display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid {LN}; {NUM}">{icon("validade", 20, G2)}<div style="flex: 1 1 0; min-width: 0"><div style="font-weight: 600; font-size: 14px; line-height: 20px">Lote {cod}</div>'
            f'<div style="font-size: 13px; line-height: 18px; color: {G2}">{val}</div></div>{tag}</div>')
gest = col(lbl('Indicador · início da gestão')
           + grid(2, kpi('Vendas hoje', 'R$ 1.284,50', 'balcão 892,00 · internet 392,50') + kpi('Pedidos pendentes', '4', '2 novos · 2 em preparo')
                  + kpi('Estoque baixo', '7 itens', 'ver lista', AT_T) + kpi('A pagar hoje', 'R$ 640,00', '2 contas', ER_T), 8)
           + lbl('Saldos de estoque')
           + f'<div style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 12px">'
             f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><div style="font-weight: 600">Queijo coalho</div>{tagc("Estoque baixo", AT_T, AT_B)}</div>'
             f'<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">{sal("Físico", "18")}{sal("Reservado", "6")}{sal("Disponível", "12", True)}{sal("Projetado", "32")}</div>'
             + lote('QC-1107', 'Validade 19/11/2026 · 8 un', tagc('Vence em 5 dias', AT_T, AT_B)) + lote('QC-1112', 'Validade 02/12/2026 · 10 un', tagc('No prazo', OK_T, OK_B)) + '</div>', 10)

def lanc(t, sub, v, fg, tag):
    return (f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid {LN}; {NUM}"><div style="flex: 1 1 0; min-width: 0"><div style="font-weight: 600">{t}</div>'
            f'<div style="font-size: 13px; line-height: 18px; color: {G2}">{sub}</div></div><div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px"><div style="font-weight: 600; color: {fg}">{v}</div>{tag}</div></div>')
def passo(t, sub, estado):
    dot = {'ok': f'background: {V}; color: {W}; border: 2px solid {V}', 'agora': f'background: {W}; color: {T}; border: 2px solid {T}', 'depois': f'background: {W}; color: {G2}; border: 2px solid {LN}'}[estado]
    ic = icon('confirmar', 14) if estado == 'ok' else ''
    return (f'<li style="display: flex; gap: 12px; align-items: flex-start"><span aria-hidden="true" style="flex: none; width: 24px; height: 24px; border-radius: 999px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; {dot}">{ic}</span>'
            f'<div><div style="font-weight: {700 if estado == "agora" else 600}; color: {G if estado != "depois" else G2}">{t}</div><div style="font-size: 13px; line-height: 18px; color: {G2}">{sub}</div></div></li>')
fin = col(lbl('Lançamento financeiro')
          + f'<div style="padding: 4px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
            + lanc('Laticínios Serra Verde', 'A pagar · vence hoje', '− R$ 420,00', G, tagc('Vence hoje', AT_T, AT_B)).replace(f'border-top: 1px solid {LN}; ', '', 1)
            + lanc('Vendas no Pix', 'Recebido · 13/11', '+ R$ 392,50', V, tagc('Pago', OK_T, OK_B))
            + lanc('Aluguel', 'A pagar · venceu 10/11', '− R$ 1.800,00', G, tagc('Atrasado', ER_T, ER_B)) + '</div>'
          + lbl('Linha do tempo do pedido')
          + f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}"><div style="{SM}; margin-bottom: 12px">Previsão de entrega: hoje, 15h40</div>'
            f'<ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 14px">'
            + passo('Pedido recebido', '14h52', 'ok') + passo('Em preparo', '14h58', 'ok') + passo('Saiu para entrega', 'Agora', 'agora') + passo('Entregue', 'Informe o código 4821 ao entregador', 'depois') + '</ol></div>', 10)

ent = col(lbl('Cartão de entrega · entregador')
          + f'<article style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 12px">'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><div style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">Pedido 1042</div>{tagc("Parceiro", G, C)}</div>'
            f'<div style="display: flex; gap: 10px; align-items: flex-start; color: {G}">{icon("local", 20, G2)}<div><div style="font-weight: 600">Jardim das Flores</div><div style="font-size: 13px; line-height: 18px; color: {G2}">Rua das Camélias, 120 · apto 34</div></div></div>'
            f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; {NUM}">{sal("Distância", "3,2 km", True)}{sal("Itens", "5", True)}{sal("Valor da entrega", "R$ 8,00", True)}</div>'
            + btn('Aceitar entrega', 'p', 56, 'width: 100%') + '</article>'
          + lbl('Etapa da entrega · uma ação por vez')
          + f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 12px">'
            f'<div style="display: flex; gap: 6px">' + ''.join(f'<span aria-hidden="true" style="flex: 1 1 0; height: 6px; border-radius: 999px; background: {c}"></span>' for c in (V, V, T, LN)) + '</div>'
            f'<div><div style="{SM}">Etapa 3 de 4</div><div style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">Em rota para o cliente</div></div>'
            + btn('Cheguei ao destino', 'p', 56, 'width: 100%') + btn('Problema na entrega', 'q', 48, 'width: 100%') + '</div>'
          + lbl('Código de confirmação')
          + f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 10px"><div id="cod" style="font-weight: 600">Código informado pelo cliente</div>'
            f'<div role="group" aria-labelledby="cod" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">'
            + ''.join(f'<input type="text" inputmode="numeric" maxlength="1" aria-label="Dígito {i + 1}" value="{v}" style="height: 56px; border-radius: 8px; border: {"2px solid " + G if i == 2 else "1.5px solid " + LN}; text-align: center; font: 600 22px {FB}; color: {G}; box-sizing: border-box; width: 100%; outline: none">' for i, v in enumerate(('4', '8', '', ''))) + '</div></div>', 10)

body = grid(4, sec('Loja', 'Produto, sacola e valores.', loja) + sec('PDV', 'Velocidade: um toque por item.', pdv) + sec('Gestão', 'O que pede ação hoje.', gest + fin, 'gap: 20px') + sec('Entregas', 'Uma mão, uma ação por etapa.', ent), 24)

page('DS-Dominio.dc.html', 'Bodeleve — design system: componentes de domínio', 'Etapa 2 · Design system · 4 de 5', 'Componentes de domínio',
     'Produto, estoque, financeiro, venda e entrega. Montados só com os fundamentos e componentes base.',
     f'<b style="color: {G}">Dados fictícios.</b> Nomes, preços, saldos e endereços são exemplos, não dados reais do Bodeleve.', body, 1760, 1800)
