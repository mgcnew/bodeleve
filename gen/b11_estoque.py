from b10_compras import *   # regenera lotes 1 e 2 da gestão (aba Estoque ativa) e traz os auxiliares

def chips(n_list, prefix='t'):
    return ''.join(f'<button type="button" aria-pressed="{H("a" + str(i))}" onClick="{H(prefix + str(i))}" style="flex: none; height: 44px; padding: 0 14px; border-radius: 999px; border: 1.5px solid {G}; '
                   f'background: {H("b" + str(i))}; color: {H("c" + str(i))}; font: 600 14px {FB}; {NUM}">{t}</button>' for i, t in enumerate(n_list))
def chips_logic(n, var='t'):
    return ("[" + ', '.join(str(i) for i in range(n)) + "].forEach((k) => { out['a' + k] = " + var + " === k; out['b' + k] = " + var + " === k ? '" + G + "' : '" + W + "'; out['c' + k] = " + var + " === k ? '" + W + "' : '" + G + "'; out['t' + k] = () => this.setState({ " + var + ": k }); });\n")
ORIG = {'casa': seal('Feito na casa', V), 'marca': seal('Marca Bodeleve', T), 'rev': f'<span style="padding: 2px 10px; border-radius: 999px; border: 1px solid {G2}; color: {G2}; font-size: 12px; line-height: 18px; font-weight: 600">Revenda</span>',
        'mp': f'<span style="padding: 2px 10px; border-radius: 999px; background: {C}; border: 1px solid {LN}; color: {G}; font-size: 12px; line-height: 18px; font-weight: 600">Matéria-prima</span>'}

# ---------- Estoque (visão geral) ----------
EST = [  # nome, origem, disponível, mínimo, baixo, vencendo, linha extra, href
    ('Queijo coalho 500 g', 'casa', '12 un', 'mín. 15', True, True, 'Lote vence 19/11', 'Gestao-EstoqueItem.dc.html'),
    ('Tapioca granulada 500 g', 'rev', '3 un', 'mín. 10', True, False, '', None),
    ('Rapadura 400 g', 'marca', '4 un', 'mín. 12', True, False, '', None),
    ('Leite integral 1 L', 'mp', '18 L', 'mín. 40', True, False, '140 L chegam hoje', None),
    ('Nata 200 g', 'rev', '5 un', 'mín. 6', True, True, 'Lote vence 18/11', None),
    ('Coalho líquido 50 ml', 'mp', '1 un', 'mín. 3', True, False, '', None),
    ('Melaço de cana 500 ml', 'rev', '6 un', 'mín. 6', True, False, '', None),
    ('Doce de leite 400 g', 'casa', '9 un', 'mín. 8', False, True, 'Lote vence 20/11', None),
    ('Farinha de mandioca 1 kg', 'rev', '26 un', 'mín. 12', False, False, '', None),
    ('Manteiga de garrafa 200 ml', 'marca', '11 un', 'mín. 6', False, False, '', None),
    ('Carne de sol', 'rev', '6,4 kg', 'mín. 5 kg', False, False, '', None),
]
def erow(i):
    n, o, d, mn, baixo, venc, extra, href = EST[i]
    cor = AT_T if baixo else G
    tags = (tagc('Baixo', AT_T, AT_B) if baixo else '') + (tagc('Vencendo', ER_T, ER_B) if venc else '')
    inner = (f'<span style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 4px"><span style="font-weight: 600">{n}</span>'
             f'<span style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center">{ORIG[o]}{tags}</span>'
             + (f'<span style="font-size: 13px; line-height: 18px; color: {G2}">{extra}</span>' if extra else '') + '</span>'
             f'<span style="flex: none; text-align: right; {NUM}"><span style="display: block; font-weight: 700; font-size: 18px; color: {cor}">{d}</span><span style="display: block; font-size: 12px; line-height: 16px; color: {G2}">{mn}</span></span>')
    st = f'display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; text-decoration: none; color: {G}'
    row = f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>' if href else f'<div style="{st}">{inner}</div>'
    return f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true")}">{row}</sc-if>'
resumo = lambda t, v, fg, bg: f'<div style="padding: 12px; border-radius: 12px; background: {bg}; color: {fg}; display: flex; flex-direction: column; gap: 2px; min-width: 0"><span style="font-size: 13px; line-height: 18px">{t}</span><span style="font-weight: 700; font-size: 22px; line-height: 28px; {NUM}">{v}</span></div>'
acao2 = lambda ic, t, href: f'<a href="{href}" style="flex: 1 1 0; min-width: 0; height: 48px; border-radius: 12px; border: 1.5px solid {G}; color: {G}; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; font-size: 15px">{icon(ic, 20)}{t}</a>'
estoque = (titulo('Estoque', 'Saldo disponível = físico menos reservado')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 8px 16px 24px">'
    f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">' + resumo('Baixo', '7', AT_T, AT_B) + resumo('Vencendo', '3', ER_T, ER_B) + resumo('Valor', 'R$ 8,4 mil', G, W).replace(f'background: {W}', f'background: {W}; border: 1px solid {LN}') + '</div>'
    f'<div style="display: flex; gap: 8px">' + acao2('confirmar', 'Contar estoque', 'Gestao-Inventario.dc.html') + acao2('remover', 'Registrar perda', 'Gestao-Ajuste.dc.html') + '</div>'
    f'<div role="group" aria-label="Filtrar itens" style="display: flex; gap: 8px; flex-wrap: wrap">' + chips(['Todos · 11', 'Baixo · 7', 'Vencendo · 3']) + '</div>'
    + box(''.join(erow(i) for i in range(len(EST))), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Itens à venda e matérias-primas ficam juntos; o selo mostra o tipo de cada um.</div></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(2)}</div>')
logic_est = ("renderVals() {\nconst B = [" + ', '.join('true' if e[4] else 'false' for e in EST) + "];\nconst V = [" + ', '.join('true' if e[5] else 'false' for e in EST) + "];\n"
             "const t = (this.state && this.state.t) || 0;\nconst out = {};\nB.forEach((b, i) => { out['v' + i] = t === 0 || (t === 1 && b) || (t === 2 && V[i]); });\n" + chips_logic(3) + "return out;\n}")
gphone('Gestao-Estoque.dc.html', 'Bodeleve — gestão: estoque', 1500, estoque, logic_est)

# ---------- Item (saldos e lotes) ----------
sal = lambda t, v, sub, strong=False: (f'<div style="padding: 12px; border-radius: 12px; background: {T if strong else W}; color: {W if strong else G}; border: 1px solid {T if strong else LN}; display: flex; flex-direction: column; gap: 2px; min-width: 0">'
                                       f'<span style="font-size: 13px; line-height: 18px">{t}</span><span style="font-weight: 700; font-size: 24px; line-height: 30px; {NUM}">{v}</span><span style="font-size: 12px; line-height: 16px; opacity: 0.85">{sub}</span></div>')
def lote(cod, val, qtd, tag, prox=False):
    p = f'<span style="font-size: 13px; line-height: 18px; color: {TP}; font-weight: 600">Próximo a sair</span>' if prox else ''
    return (f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}">{icon("validade", 22, G2)}'
            f'<div style="flex: 1 1 0; min-width: 0"><div style="font-weight: 600">Lote {cod}</div><div style="font-size: 13px; line-height: 18px; color: {G2}">Vence {val} · {qtd}</div>{p}</div>{tag}</div>')
item = (bar('Queijo coalho 500 g', 'Gestao-Estoque.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; gap: 8px; flex-wrap: wrap">{ORIG["casa"]}{tagc("Estoque baixo", AT_T, AT_B)}</div>'
    f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
    + sal('Disponível', '12', 'pode ser vendido agora', True) + sal('Físico', '18', 'na prateleira') + sal('Reservado', '6', '3 pedidos online') + sal('Projetado', '32', '+ 20 em produção') + '</div>'
    f'<div style="{SM}">Mínimo: 15 un. Com a produção em andamento (OP-0032, termina hoje às 18h), o saldo volta acima do mínimo.</div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Lotes")}'
    + box(lote('QC-1107', '19/11/2026', '8 un', tagc('Vence em 5 dias', AT_T, AT_B), True) + lote('QC-1112', '02/12/2026', '10 un', tagc('No prazo', OK_T, OK_B)), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Vendas e pedidos usam primeiro o lote que vence antes.</div></section>'
    + card(li('Tipo', 'Produto acabado') + li('Custo de produção', 'R$ 14,20 / un') + li('Preço de venda', 'R$ 32,90') + li('Na loja online', 'Publicado'))
    + '</main>'
    + rodape(f'<div style="display: flex; gap: 8px">' + acao2('historico', 'Movimentações', 'Gestao-Movimentacoes.dc.html') + acao2('remover', 'Ajustar', 'Gestao-Ajuste.dc.html') + '</div>'))
gphone('Gestao-EstoqueItem.dc.html', 'Bodeleve — gestão: item de estoque', 1180, item, VAZIO)

# ---------- Movimentações ----------
MOV = [  # data, tipo, detalhe, qtd, saldo, entrada?
    ('Hoje, 14h58', 'Venda no balcão', 'Lote QC-1107', '−2', '18', False),
    ('Hoje, 11h10', 'Venda online · pedido #1037', 'Lote QC-1107', '−1', '20', False),
    ('13/11, 17h40', 'Produção · OP-0031', 'Entrada do lote QC-1112', '+10', '21', True),
    ('12/11, 18h05', 'Perda · embalagem danificada', 'Lote QC-1107 · por Ana', '−1', '11', False),
    ('11/11, 16h20', 'Venda no balcão', 'Lote QC-1107', '−3', '12', False),
]
def mrow2(i):
    d, t, det, q, s, e = MOV[i]
    return (f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true")}"><div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}">'
            f'<span aria-hidden="true" style="flex: none; width: 36px; height: 36px; border-radius: 10px; background: {OK_B if e else C}; color: {OK_T if e else G2}; display: flex; align-items: center; justify-content: center">{icon("adicionar" if e else "remover", 18)}</span>'
            f'<div style="flex: 1 1 0; min-width: 0"><div style="font-weight: 600">{t}</div><div style="font-size: 13px; line-height: 18px; color: {G2}">{d} · {det}</div></div>'
            f'<div style="text-align: right"><div style="font-weight: 700; color: {OK_T if e else G}">{q} un</div><div style="font-size: 12px; line-height: 16px; color: {G2}">saldo {s}</div></div></div></sc-if>')
movs = (bar('Movimentações', 'Gestao-EstoqueItem.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px"><div><div style="font-weight: 600">Queijo coalho 500 g</div><div style="{SM}">Saldo físico atual: 18 un</div></div>'
    f'<div role="group" aria-label="Filtrar movimentações" style="display: flex; gap: 8px">' + chips(['Todas', 'Entradas', 'Saídas']) + '</div>'
    + box(''.join(mrow2(i) for i in range(len(MOV))), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Reservas de pedidos online não são movimentação: só baixam o estoque quando o pedido sai.</div></main>')
logic_mov = ("renderVals() {\nconst E = [" + ', '.join('true' if m[5] else 'false' for m in MOV) + "];\nconst t = (this.state && this.state.t) || 0;\nconst out = {};\n"
             "E.forEach((e, i) => { out['v' + i] = t === 0 || (t === 1 && e) || (t === 2 && !e); });\n" + chips_logic(3) + "return out;\n}")
gphone('Gestao-Movimentacoes.dc.html', 'Bodeleve — gestão: movimentações', 860, movs, logic_mov)

# ---------- Ajuste / perda ----------
def radio(fid, grupo, t, sub, on=False):
    return (f'<label for="{fid}" style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 10px 14px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
            f'<input id="{fid}" type="radio" name="{grupo}"{" checked" if on else ""} style="flex: none; width: 22px; height: 22px; accent-color: {T}; margin: 0">'
            f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{t}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{sub}</span></span></label>')
sel = lambda fid, label, opts: (f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="{fid}" style="font-size: 14px; line-height: 20px; font-weight: 600">{label}</label>'
                                f'<select id="{fid}" style="height: 48px; padding: 0 12px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}">' + ''.join(f'<option>{o}</option>' for o in opts) + '</select></div>')
ajuste = (bar('Ajustar estoque', 'Gestao-EstoqueItem.dc.html')
    + f'<sc-if value="{H("editando")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div><div style="font-weight: 600">Queijo coalho 500 g</div><div style="{SM}">Físico 18 un · disponível 12 un</div></div>'
    f'<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 8px"><legend style="padding: 0; margin-bottom: 8px; font-weight: 600">O que aconteceu?</legend>'
    + radio('tp1', 'tipo', 'Perda', 'Vencido, danificado, estragado', True) + radio('tp2', 'tipo', 'Consumo interno', 'Usado na casa, degustação') + radio('tp3', 'tipo', 'Correção de contagem', 'O sistema estava errado') + '</fieldset>'
    + sel('lote', 'Lote', ['QC-1107 · vence 19/11 · 8 un', 'QC-1112 · vence 02/12 · 10 un'])
    + f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}"><span style="font-weight: 600">Quantidade que saiu</span>'
    + stepper('Quantidade', H('menos'), H('mais'), H('q')) + '</div>'
    + sel('motivo', 'Motivo', ['Embalagem danificada', 'Vencido', 'Estragou', 'Outro'])
    + card(li('Saldo físico', H('saldo')) + li('Custo da perda', H('custo'))) + '</main>'
    + rodape(f'<button type="button" onClick="{H("registrar")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}; width: 100%">Registrar saída</button>') + '</sc-if>'
    f'<sc-if value="{H("feito")}" hint-placeholder-val="{H("false")}"><main style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 48px 24px">'
    f'<div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("confirmar", 32)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Saída registrada</h1><div style="color: {G2}; {NUM}">{H("resumo")}</div></main>'
    + rodape(cta('Voltar ao item', 'Gestao-EstoqueItem.dc.html') + f'<button type="button" onClick="{H("desfazer")}" style="height: 48px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}">Desfazer</button>') + '</sc-if>')
logic_aj = ('renderVals() {\n' + FMT + "\nconst st = this.state || {};\nconst q = st.q || 1;\nconst feito = !!st.feito;\n"
            "return { editando: !feito, feito: feito, q: q, saldo: '18 → ' + (18 - q) + ' un', custo: fmt(q * 14.2), resumo: q + ' un de Queijo coalho · ' + fmt(q * 14.2) + ' de custo · lote QC-1107',\n"
            "  menos: () => this.setState({ q: Math.max(1, q - 1) }), mais: () => this.setState({ q: Math.min(8, q + 1) }), registrar: () => this.setState({ feito: true }), desfazer: () => this.setState({ feito: false }) };\n}")
gphone('Gestao-Ajuste.dc.html', 'Bodeleve — gestão: ajuste de estoque', 1000, ajuste, logic_aj)

# ---------- Inventário ----------
INV = [('Queijo coalho 500 g', 18, 14.20), ('Queijo manteiga 500 g', 9, 16.80), ('Doce de leite 400 g', 9, 7.90), ('Requeijão 250 g', 14, 6.80), ('Nata 200 g', 5, 5.20), ('Manteiga de garrafa 200 ml', 11, 15.00)]
def irow(i):
    n, s, c = INV[i]
    return (f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-bottom: 1px solid {LN}">'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-weight: 600">{n}</span>'
            f'<sc-if value="{H("ok" + str(i))}" hint-placeholder-val="{H("true")}">{tagc("Confere", OK_T, OK_B)}</sc-if><sc-if value="{H("df" + str(i))}" hint-placeholder-val="{H("false")}">{tagc(H("dt" + str(i)), AT_T, AT_B)}</sc-if></div>'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-size: 14px; line-height: 20px; color: {G2}; {NUM}">Sistema: {s} un</span>'
            + stepper('Contado de ' + n, H('m' + str(i)), H('p' + str(i)), H('q' + str(i)), True) + '</div></div>')
inv = (bar('Contar estoque', 'Gestao-Estoque.dc.html')
    + f'<sc-if value="{H("contando")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    + sel('area', 'O que contar', ['Queijos e laticínios · 6 itens', 'Doces · 5 itens', 'Farinhas e grãos · 8 itens', 'Tudo · 41 itens'])
    + f'<div style="{SM}">Conte o que está na prateleira e ajuste o número de cada item. Itens reservados para pedidos também contam.</div>'
    + box(''.join(irow(i) for i in range(len(INV))), 'padding-top: 0; padding-bottom: 0')
    + card(li('Itens com diferença', H('ndif')) + li('Diferença em unidades', H('udif')) + f'<div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid {LN}; font-weight: 600; {NUM}"><span>Diferença em custo</span><span>{H("vdif")}</span></div>')
    + '</main>' + rodape(f'<button type="button" onClick="{H("aplicar")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}; width: 100%">Aplicar contagem</button>') + '</sc-if>'
    f'<sc-if value="{H("feito")}" hint-placeholder-val="{H("false")}"><main style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 48px 24px">'
    f'<div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("confirmar", 32)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Contagem aplicada</h1><div style="color: {G2}; {NUM}">{H("resumo")}</div></main>'
    + rodape(cta('Voltar ao estoque', 'Gestao-Estoque.dc.html') + f'<button type="button" onClick="{H("desfazer")}" style="height: 48px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}">Corrigir contagem</button>') + '</sc-if>')
logic_inv = ('renderVals() {\n' + FMT + "\nconst S = [" + ', '.join(str(x[1]) for x in INV) + "];\nconst C = [" + ', '.join(str(x[2]) for x in INV) + "];\nconst st = this.state || {};\nconst q = st.q || [17, 9, 9, 14, 5, 11];\nconst feito = !!st.feito;\n"
             "const chg = (i, d) => () => { const c = q.slice(); c[i] = Math.max(0, c[i] + d); this.setState({ q: c }); };\n"
             "const d = q.map((v, i) => v - S[i]);\nconst nd = d.filter((x) => x !== 0).length;\nconst ud = d.reduce((a, b) => a + b, 0);\nconst vd = d.reduce((a, b, i) => a + b * C[i], 0);\n"
             "const sg = (x) => (x > 0 ? '+' : x < 0 ? '−' : '');\n"
             "const out = { contando: !feito, feito: feito, ndif: String(nd), udif: sg(ud) + Math.abs(ud) + ' un', vdif: sg(vd) + ' ' + fmt(Math.abs(vd)), resumo: nd === 0 ? 'Tudo conferiu. Nenhum ajuste foi feito.' : nd + (nd === 1 ? ' ajuste lançado' : ' ajustes lançados') + ' · ' + sg(vd) + ' ' + fmt(Math.abs(vd)) + ' em custo',\n"
             "  aplicar: () => this.setState({ feito: true }), desfazer: () => this.setState({ feito: false }) };\n"
             "q.forEach((v, i) => { out['q' + i] = v; out['ok' + i] = d[i] === 0; out['df' + i] = d[i] !== 0; out['dt' + i] = (d[i] > 0 ? 'Sobra ' : 'Falta ') + Math.abs(d[i]); out['m' + i] = chg(i, -1); out['p' + i] = chg(i, 1); });\nreturn out;\n}")
gphone('Gestao-Inventario.dc.html', 'Bodeleve — gestão: inventário', 1240, inv, logic_inv)
