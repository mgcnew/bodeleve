from common import *

def sw(name, hx, role, border=False):
    b = f'border: 1px solid {LN}; ' if border else ''
    return col(f'<div style="height: 88px; border-radius: 12px; background: {hx}; {b}box-sizing: border-box"></div>'
               f'<div><div style="font-weight: 600; font-size: 14px; line-height: 20px">{name}</div><div style="font-size: 13px; line-height: 18px; color: {G2}">{hx}<br>{role}</div></div>', 10)

marca = grid(7, ''.join([
    sw('cor.terracota', T, 'Ação principal'),
    sw('cor.terracota.pressionado', TP, 'Toque e foco'),
    sw('cor.terracota.suave', TS, 'Fundo de destaque'),
    sw('cor.verde', V, 'Positivo, feito na casa'),
    sw('cor.mostarda', M, 'Destaque, só fundo'),
    sw('cor.creme', C, 'Fundo da loja', True),
    sw('cor.grafite', G, 'Texto'),
]), 20)

def semrow(nome, fg, bg, ratio, uso):
    return (f'<div style="display: flex; align-items: center; gap: 16px">{tagc(nome, fg, bg)}'
            f'<div style="font-size: 14px; line-height: 20px; color: {G2}; font-variant-numeric: tabular-nums">{fg} sobre {bg} · {ratio} : 1 · {uso}</div></div>')

sem = col(''.join([
    semrow('Sucesso', OK_T, OK_B, '6,37', 'em estoque, pago, entregue'),
    semrow('Atenção', AT_T, AT_B, '5,37', 'estoque baixo, vence em breve'),
    semrow('Erro', ER_T, ER_B, '7,21', 'sem estoque, vencido, falha'),
    semrow('Informação', IN_T, IN_B, '5,66', 'em produção, em rota'),
]), 14)

sup = grid(3, ''.join([
    sw('fundo.loja', C, 'Loja online', True),
    sw('fundo.operacao', OP, 'Gestão, PDV, Entregas', True),
    sw('superficie', W, 'Cartões e sheets', True),
    sw('linha', LN, 'Bordas e divisores'),
    sw('texto', G, '13,51 : 1 sobre creme'),
    sw('texto.secundario', G2, '6,31 : 1 sobre creme'),
]), 20)

def trow(tok, spec, sample, style):
    return (f'<div style="display: flex; align-items: baseline; gap: 24px; padding-bottom: 12px; border-bottom: 1px solid {LN}">'
            f'<div style="flex: none; width: 150px; font-size: 13px; line-height: 18px; color: {G2}"><b style="color: {G}">{tok}</b><br>{spec}</div>'
            f'<div style="min-width: 0; {style}">{sample}</div></div>')

tipo = col(''.join([
    trow('titulo.xl', '34 / 40 · 700', 'Casa do Norte', f'font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px; letter-spacing: -0.01em'),
    trow('titulo.l', '28 / 34 · 700', 'Linha Bodeleve', f'font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px'),
    trow('titulo.m', '22 / 28 · 700', 'Pedidos de hoje', f'font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 28px'),
    trow('titulo.s', '18 / 26 · 600', 'Queijo coalho', 'font-weight: 600; font-size: 18px; line-height: 26px'),
    trow('corpo', '16 / 24 · 400', 'Texto de leitura e campos de formulário.', 'font-size: 16px; line-height: 24px'),
    trow('apoio', '14 / 20 · 400', 'Descrições, unidades e textos de ajuda.', f'font-size: 14px; line-height: 20px; color: {G2}'),
    trow('legenda', '12 / 16 · 600', 'RÓTULO DE SEÇÃO', f'font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.06em; color: {G2}'),
    trow('valor', '22 / 28 · 600 tabular', 'R$ 1.234,56', 'font-size: 22px; line-height: 28px; font-weight: 600; font-variant-numeric: tabular-nums'),
]), 12)

esp = ''.join(f'<div style="display: flex; align-items: center; gap: 16px"><div style="flex: none; width: 28px; font-size: 14px; line-height: 20px; font-variant-numeric: tabular-nums">{n}</div><div style="width: {n*4}px; height: 16px; border-radius: 4px; background: {T}"></div></div>' for n in (4, 8, 12, 16, 24, 32, 48))
raios = row(''.join(f'<div style="display: flex; flex-direction: column; gap: 8px; align-items: center"><div style="width: 72px; height: 72px; border: 1.5px solid {G}; border-radius: {r}; box-sizing: border-box; background: {C}"></div><div style="font-size: 13px; line-height: 18px; color: {G2}; text-align: center">{n}<br>{u}</div></div>'
                    for r, n, u in (('8px', '8', 'campos'), ('12px', '12', 'cartões'), ('20px', '20', 'sheets'), ('999px', 'total', 'pílulas'))), 24)
toque = row(''.join(f'<div style="width: {s}px; height: {s}px; border-radius: 12px; background: {TS}; border: 1.5px dashed {T}; box-sizing: border-box; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: {TP}">{s}</div>' for s in (44, 56))
            + f'<div style="{SM}">Alvo mínimo de toque: 44 px.<br>Ações principais e PDV: 48 a 56 px.</div>', 16)

nomes = ['inicio', 'buscar', 'sacola', 'pedidos', 'perfil', 'estoque', 'financeiro', 'mais', 'vender', 'historico', 'caixa', 'entregas',
         'compras', 'producao', 'adicionar', 'remover', 'avancar', 'voltar', 'confirmar', 'fechar', 'alerta', 'validade', 'local', 'sem-conexao']
icones = grid(12, ''.join(f'<div style="display: flex; flex-direction: column; gap: 8px; align-items: center; padding: 12px 4px; border-radius: 10px; background: {C}">{icon(n)}<div style="font-size: 12px; line-height: 16px; color: {G2}">{n}</div></div>' for n in nomes), 12)

body = (sec('Cores de marca', 'Paleta do briefing mantida. Terracota conduz a ação; mostarda nunca é cor de texto.', marca)
        + grid(2, sec('Cores semânticas', 'Sempre com ícone ou texto junto: a cor nunca é o único sinal.', sem)
               + sec('Superfícies e texto', 'Duas superfícies de fundo, conforme o ambiente.', sup))
        + grid(2, sec('Tipografia', 'Bricolage Grotesque nos títulos, Inter na interface. Base de 16 px.', tipo)
               + col(sec('Espaçamento', 'Base 4. Valores em px.', col(esp, 10))
                     + sec('Raios e toque', 'Quatro raios; alvos de toque generosos.', col(raios + toque, 24)), 24))
        + sec('Ícones', 'Traço de 1,75 px, pontas arredondadas, grade de 24 px. Sem emoji.', icones))

page('DS-Fundamentos.dc.html', 'Bodeleve — design system: fundamentos', 'Etapa 2 · Design system · 1 de 5', 'Fundamentos',
     'Cores, tipografia, espaçamento, forma e ícones. Tudo o que os componentes dos quatro ambientes compartilham.',
     f'<b style="color: {G}">Sem logotipo oficial.</b> A marca segue apenas como texto até haver aprovação.', body, 1440, 2240)
