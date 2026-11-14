from common import *

spin = f'<span aria-hidden="true" style="width: 16px; height: 16px; border-radius: 999px; border: 2px solid rgba(255,255,255,0.45); border-top-color: {W}; box-sizing: border-box"></span>'
botoes = col(
    lbl('Variantes · 48 px') + row(btn('Adicionar à sacola') + btn('Ver detalhes', 's') + btn('Agora não', 'q') + btn('Cancelar venda', 'd'))
    + lbl('Estados da ação principal') + row(btn('Padrão') + btn('Pressionado', 'pp') + btn('Desabilitado', 'x') + btn('Enviando…', 'p', pre=spin))
    + lbl('PDV · 56 px, largura total') + btn('Cobrar R$ 86,40', 'p', 56, 'width: 100%; font-size: 18px; font-variant-numeric: tabular-nums')
    + lbl('Só ícone · sempre com nome acessível')
    + row(f'<button type="button" aria-label="Adicionar" style="width: 48px; height: 48px; border-radius: 12px; border: 0; background: {T}; color: {W}; display: inline-flex; align-items: center; justify-content: center">{icon("adicionar")}</button>'
          f'<button type="button" aria-label="Fechar" style="width: 48px; height: 48px; border-radius: 12px; border: 1.5px solid {LN}; background: {W}; color: {G}; display: inline-flex; align-items: center; justify-content: center">{icon("fechar")}</button>'), 14)

def field(fid, label, value, state='', help_=''):
    bd = {'': f'1.5px solid {LN}', 'foco': f'2px solid {G}', 'erro': f'2px solid {ER_T}', 'off': f'1.5px solid {LN}'}[state]
    bg = OP if state == 'off' else W
    dis = ' disabled' if state == 'off' else ''
    hc = ER_T if state == 'erro' else G2
    h = f'<div style="font-size: 13px; line-height: 18px; color: {hc}; display: flex; gap: 6px; align-items: center">{icon("alerta", 16) if state == "erro" else ""}{help_}</div>' if help_ else ''
    return col(f'<label for="{fid}" style="font-size: 14px; line-height: 20px; font-weight: 600">{label}</label>'
               f'<input id="{fid}" type="text" value="{value}"{dis} style="height: 48px; padding: 0 14px; border-radius: 8px; border: {bd}; background: {bg}; color: {G if state != "off" else G2}; font: 400 16px {FB}; box-sizing: border-box; width: 100%; outline: none">{h}', 6)

campos = grid(2, ''.join([
    field('f1', 'Nome do produto', 'Farinha de mandioca', '', 'Padrão'),
    field('f2', 'Preço de venda', 'R$ 12,90', 'foco', 'Em foco: borda grafite de 2 px'),
    field('f3', 'Validade do lote', '31/02/2027', 'erro', 'Data inválida. Use dia/mês/ano.'),
    field('f4', 'Código interno', 'Gerado ao salvar', 'off', 'Desabilitado'),
]), 20) + col(
    f'<label for="f5" style="font-size: 14px; line-height: 20px; font-weight: 600">Busca</label>'
    f'<div style="display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px; border-radius: 999px; background: {C}; border: 1.5px solid {LN}; color: {G2}">{icon("buscar", 20)}'
    f'<input id="f5" type="search" placeholder="Buscar produto" style="flex: 1 1 0; min-width: 0; border: 0; background: transparent; font: 400 16px {FB}; color: {G}; outline: none"></div>', 6)

step = (f'<div style="display: inline-flex; align-items: center; border: 1.5px solid {LN}; border-radius: 12px; overflow: hidden; background: {W}">'
        f'<button type="button" aria-label="Diminuir" style="width: 48px; height: 48px; border: 0; background: transparent; color: {G}; display: inline-flex; align-items: center; justify-content: center">{icon("remover", 20)}</button>'
        f'<div style="min-width: 40px; text-align: center; font-weight: 600; font-variant-numeric: tabular-nums">2</div>'
        f'<button type="button" aria-label="Aumentar" style="width: 48px; height: 48px; border: 0; background: transparent; color: {T}; display: inline-flex; align-items: center; justify-content: center">{icon("adicionar", 20)}</button></div>')
chip = lambda t, on=False: f'<button type="button" style="height: 40px; padding: 0 14px; border-radius: 999px; border: 1.5px solid {G if on else LN}; background: {G if on else W}; color: {W if on else G}; font: 600 14px {FB}">{t}</button>'
peso = col(
    f'<label for="p1" style="font-size: 14px; line-height: 20px; font-weight: 600">Peso</label>'
    f'<div style="display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 16px; border-radius: 8px; border: 2px solid {G}; background: {W}">'
    f'<input id="p1" type="text" inputmode="decimal" value="0,500" style="flex: 1 1 0; min-width: 0; border: 0; background: transparent; font: 600 22px {FB}; color: {G}; font-variant-numeric: tabular-nums; outline: none"><span style="color: {G2}; font-weight: 600">kg</span></div>'
    + row(chip('250 g') + chip('500 g', True) + chip('1 kg'), 8)
    + f'<div style="{SM}; font-variant-numeric: tabular-nums">R$ 59,90 / kg · total R$ 29,95</div>', 8)
qtd = col(lbl('Por unidade') + step + lbl('Por peso') + peso, 12)

chk = lambda fid, t, on: (f'<label for="{fid}" style="display: flex; align-items: center; gap: 12px; min-height: 48px"><input id="{fid}" type="checkbox"{" checked" if on else ""} style="width: 22px; height: 22px; accent-color: {T}; margin: 0"><span>{t}</span></label>')
rad = lambda fid, t, on: (f'<label for="{fid}" style="display: flex; align-items: center; gap: 12px; min-height: 48px"><input id="{fid}" type="radio" name="ent"{" checked" if on else ""} style="width: 22px; height: 22px; accent-color: {T}; margin: 0"><span>{t}</span></label>')
seg = (f'<div role="group" aria-label="Tipo de entrega" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 4px; border-radius: 12px; background: {C}; border: 1px solid {LN}">'
       f'<button type="button" aria-pressed="true" style="height: 40px; border: 0; border-radius: 8px; background: {W}; color: {G}; font: 600 14px {FB}; box-shadow: 0 1px 2px rgba(41,38,33,0.12)">Entrega</button>'
       f'<button type="button" aria-pressed="false" style="height: 40px; border: 0; border-radius: 8px; background: transparent; color: {G2}; font: 600 14px {FB}">Retirada</button></div>')
sw_ = (f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px"><span id="swl">Publicar na loja</span>'
       f'<button type="button" role="switch" aria-checked="true" aria-labelledby="swl" style="width: 52px; height: 32px; border-radius: 999px; border: 0; background: {V}; padding: 4px; display: flex; justify-content: flex-end"><span style="width: 24px; height: 24px; border-radius: 999px; background: {W}"></span></button></div>')
selecao = col(lbl('Controle segmentado') + seg + lbl('Opção única') + rad('r1', 'Pix', True) + rad('r2', 'Cartão na entrega', False)
              + lbl('Múltipla e liga/desliga') + chk('c1', 'Controlar validade por lote', True) + sw_, 8)

etq = col(
    lbl('Status de estoque') + row(tagc('Em estoque', OK_T, OK_B) + tagc('Estoque baixo', AT_T, AT_B) + tagc('Sem estoque', ER_T, ER_B), 8)
    + lbl('Validade') + row(tagc('Vence em 5 dias', AT_T, AT_B) + tagc('Vencido', ER_T, ER_B), 8)
    + lbl('Pedido') + row(tagc('Novo', IN_T, IN_B) + tagc('Em preparo', AT_T, AT_B) + tagc('Pronto', OK_T, OK_B) + tagc('Em rota', IN_T, IN_B) + tagc('Entregue', OK_T, OK_B) + tagc('Cancelado', ER_T, ER_B), 8)
    + lbl('Financeiro') + row(tagc('Pago', OK_T, OK_B) + tagc('Vence hoje', AT_T, AT_B) + tagc('Atrasado', ER_T, ER_B), 8)
    + lbl('Selos de origem') + row(seal('Marca Bodeleve', T) + seal('Feito na casa', V)
                                   + f'<span style="padding: 2px 10px; border-radius: 999px; border: 1px solid {G2}; color: {G2}; font-size: 12px; line-height: 18px; font-weight: 600">Revenda</span>', 8)
    + lbl('Entregador') + row(tagc('Próprio', G, C) + tagc('Parceiro', G, C), 8), 10)

body = (grid(2, sec('Botões', 'Uma ação principal por tela. Terracota é reservada a ela.', botoes)
             + sec('Campos', 'Rótulo sempre visível acima do campo; mensagem de erro diz como corrigir.', campos))
        + grid(3, sec('Quantidade e peso', 'Unidade entra direto; peso abre em sheet com atalhos.', qtd)
               + sec('Seleção', 'Alvos de 48 px, com o rótulo inteiro clicável.', selecao)
               + sec('Etiquetas e selos', 'Texto curto, cor de apoio, nunca só cor.', etq)))

page('DS-Componentes.dc.html', 'Bodeleve — design system: componentes base', 'Etapa 2 · Design system · 2 de 5', 'Componentes base',
     'Botões, campos, seletores e etiquetas usados nos quatro ambientes. Valores e nomes são fictícios.',
     f'<b style="color: {G}">Estados desenhados:</b> padrão, pressionado, em foco, erro, desabilitado e carregando.', body, 1440, 1600)
