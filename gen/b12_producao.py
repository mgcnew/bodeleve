from b11_estoque import *   # regenera lotes 1 a 3 da gestão e traz os auxiliares

# ---------- Produção (ordens) ----------
OPS = [  # num, produto, linha, destino, tag, aba, href
    ('OP-0032', 'Queijo coalho 500 g', '20 un · iniciada 09h · termina 18h', 'Para estoque', tagc('Em produção', IN_T, IN_B), 0, 'Gestao-Ordem.dc.html'),
    ('OP-0033', 'Doce de leite 400 g', '12 un · iniciada 13h · termina amanhã 10h', 'Para estoque', tagc('Em produção', IN_T, IN_B), 0, None),
    ('OP-0034', 'Queijo manteiga 500 g', '6 un · começa amanhã 08h', 'Para pedido #1045', tagc('Planejada', G, C), 1, None),
    ('OP-0035', 'Manteiga de garrafa 200 ml', '24 un · começa 18/11', 'Para estoque', tagc('Planejada', G, C), 1, None),
    ('OP-0031', 'Queijo coalho 500 g', '10 de 10 un · lote QC-1112 · 13/11', 'Para estoque', tagc('Concluída', OK_T, OK_B), 2, None),
    ('OP-0030', 'Doce de leite 400 g', '11 de 12 un · lote DL-1110 · 10/11', 'Para estoque', tagc('Concluída', OK_T, OK_B), 2, None),
]
def opcard(i):
    n, prod, l, dest, tag, aba, href = OPS[i]
    pedido = dest.startswith('Para pedido')
    dtag = f'<span style="font-size: 12px; line-height: 16px; font-weight: 600; color: {TP if pedido else G2}">{dest}</span>'
    inner = (f'<span style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-weight: 600; font-size: 17px">{prod}</span>{tag}</span>'
             f'<span style="font-size: 14px; line-height: 20px; color: {G2}; {NUM}">{n} · {l}</span>{dtag}')
    st = f'padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; text-decoration: none; color: {G}; display: flex; flex-direction: column; gap: 4px'
    c = f'<a href="{href}" style="{st}">{inner}</a>' if href else f'<div style="{st}">{inner}</div>'
    return f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true" if aba == 0 else "false")}">{c}</sc-if>'
producao = (bar('Produção', 'Gestao-Mais.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    + cta('<span style="display: inline-flex">' + icon('producao', 20) + '</span>Fichas técnicas e nova ordem', 'Gestao-Fichas.dc.html', 'height: 48px')
    + f'<div role="group" aria-label="Filtrar ordens" style="display: flex; gap: 8px; flex-wrap: wrap">' + chips(['Em produção · 2', 'Planejadas · 2', 'Concluídas · 2']) + '</div>'
    + '<div style="display: flex; flex-direction: column; gap: 10px">' + ''.join(opcard(i) for i in range(len(OPS))) + '</div>'
    + f'<div style="{SM}">Cada ordem diz para onde vai: <b>para estoque</b> (produção antecipada) ou <b>para um pedido</b> (sob demanda).</div></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(4)}</div>')
logic_prod = ("renderVals() {\nconst A = [" + ', '.join(str(o[5]) for o in OPS) + "];\nconst t = (this.state && this.state.t) || 0;\nconst out = {};\nA.forEach((a, i) => { out['v' + i] = a === t; });\n" + chips_logic(3) + "return out;\n}")
gphone('Gestao-Producao.dc.html', 'Bodeleve — gestão: produção', 980, producao, logic_prod)

# ---------- Fichas técnicas ----------
FIC = [('Queijo coalho 500 g', 'casa', '10 un por fornada', 'R$ 14,20', '57%', 'Gestao-Ficha.dc.html'),
       ('Queijo manteiga 500 g', 'casa', '6 un por fornada', 'R$ 16,80', '54%', None),
       ('Doce de leite 400 g', 'casa', '12 un por tacho', 'R$ 7,90', '58%', None),
       ('Manteiga de garrafa 200 ml', 'marca', '24 un por lote', 'R$ 15,00', '46%', None)]
def frow2(i):
    n, o, r, c, m, href = FIC[i]
    bd = '' if i == len(FIC) - 1 else f'border-bottom: 1px solid {LN}; '
    inner = (f'<span style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 4px"><span style="font-weight: 600">{n}</span><span>{ORIG[o]}</span>'
             f'<span style="font-size: 13px; line-height: 18px; color: {G2}">{r}</span></span>'
             f'<span style="flex: none; text-align: right; {NUM}"><span style="display: block; font-weight: 700">{c}</span><span style="display: block; font-size: 12px; line-height: 16px; color: {G2}">custo / un · margem {m}</span></span>')
    st = f'display: flex; align-items: center; gap: 12px; padding: 12px 0; {bd}text-decoration: none; color: {G}'
    return f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>' if href else f'<div style="{st}">{inner}</div>'
fichas = (bar('Fichas técnicas', 'Gestao-Producao.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="{SM}">A ficha diz o que entra, quanto rende e quanto custa cada unidade. É dela que sai a ordem de produção.</div>'
    + box(''.join(frow2(i) for i in range(len(FIC))), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Produtos de revenda não têm ficha. A Rapadura da Linha Bodeleve é feita por parceiro (Engenho Boa Vista) e entra por compra.</div></main>')
gphone('Gestao-Fichas.dc.html', 'Bodeleve — gestão: fichas técnicas', 760, fichas, VAZIO)

# ---------- Ficha técnica + nova ordem ----------
ING = [  # nome, qtd por fornada (texto), custo por fornada, chave
    ('Leite integral', '40 L', 'R$ 124,00'), ('Coalho líquido', '20 ml', 'R$ 5,00'), ('Sal', '0,5 kg', 'R$ 2,00'), ('Embalagem a vácuo', '10 un', 'R$ 8,00'), ('Gás e energia (estimado)', '—', 'R$ 3,00')]
def ingrow(n, q, c, last=False):
    bd = '' if last else f'border-bottom: 1px solid {LN}; '
    return f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; {bd}{NUM}"><span>{n}<span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{q}</span></span><span>{c}</span></div>'
def need(i, n):
    return (f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid {LN}; {NUM}"><span style="min-width: 0">{n}'
            f'<span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">precisa {H("n" + str(i))} · tem {H("t" + str(i))}</span></span>'
            f'<sc-if value="{H("ok" + str(i))}" hint-placeholder-val="{H("true")}">{tagc("Tem", OK_T, OK_B)}</sc-if><sc-if value="{H("fa" + str(i))}" hint-placeholder-val="{H("false")}">{tagc(H("ft" + str(i)), AT_T, AT_B)}</sc-if></div>')
ficha = (bar('Ficha técnica', 'Gestao-Fichas.dc.html')
    + f'<sc-if value="{H("editando")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; flex-direction: column; gap: 6px"><div>{ORIG["casa"]}</div><div style="font-family: {FD}; font-weight: 700; font-size: 26px; line-height: 32px">Queijo coalho 500 g</div>'
    f'<div style="{SM}">Rende 10 un por fornada · validade 20 dias</div></div>'
    f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">'
    + ''.join(f'<div style="padding: 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}; min-width: 0"><div style="font-size: 12px; line-height: 16px; color: {G2}">{t}</div><div style="font-weight: 700; font-size: 18px; line-height: 24px; {NUM}">{v}</div></div>'
              for t, v in (('Custo / un', 'R$ 14,20'), ('Preço', 'R$ 32,90'), ('Margem', '57%'))) + '</div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Por fornada")}'
    + box(''.join(ingrow(n, q, c) for n, q, c in ING) + f'<div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid {LN}; font-weight: 600; {NUM}"><span>Total da fornada</span><span>R$ 142,00</span></div>', 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Modo de preparo: [MODO DE PREPARO DA CASA]</div></section>'
    f'<section style="display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 16px; background: {TS}">{h2("Produzir")}'
    f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px"><span><b>Fornadas</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}; {NUM}">{H("rende")}</span></span>'
    + stepper('Número de fornadas', H('menos'), H('mais'), H('f')) + '</div>'
    + box(need(0, 'Leite integral') + need(1, 'Coalho líquido') + need(2, 'Embalagem a vácuo').replace(f'border-bottom: 1px solid {LN}; ', '', 1), 'padding-top: 0; padding-bottom: 0')
    + f'<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 8px"><legend style="padding: 0; margin-bottom: 8px; font-weight: 600">Para onde vai</legend>'
    + ''.join(f'<label for="d{k}" style="display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 8px 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}"><input id="d{k}" type="radio" name="destino"{" checked" if k == 0 else ""} style="flex: none; width: 22px; height: 22px; accent-color: {T}; margin: 0"><span><b>{t}</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{s}</span></span></label>'
              for k, t, s in ((0, 'Para estoque', 'Produção antecipada'), (1, 'Para um pedido', 'Sob demanda: escolha o pedido depois'))) + '</fieldset>'
    + campo('quando', 'Começar em', 'Amanhã, 08h') + '</section></main>'
    + rodape(f'<button type="button" onClick="{H("criar")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}; width: 100%">Criar ordem de produção</button>'
             + f'<div aria-live="polite" style="{SM}; text-align: center">{H("aviso")}</div>') + '</sc-if>'
    f'<sc-if value="{H("feito")}" hint-placeholder-val="{H("false")}"><main style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 48px 24px">'
    f'<div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("confirmar", 32)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Ordem OP-0036 criada</h1><div style="color: {G2}; {NUM}">{H("resumo")}</div></main>'
    + rodape(cta('Ver ordens de produção', 'Gestao-Producao.dc.html') + f'<button type="button" onClick="{H("desfazer")}" style="height: 48px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}">Desfazer</button>') + '</sc-if>')
logic_ficha = ("renderVals() {\nconst st = this.state || {};\nconst f = st.f || 2;\nconst feito = !!st.feito;\n"
               "const leite = 40 * f, coalho = 20 * f, emb = 10 * f;\nconst tem = [18, 50, 120];\nconst pre = [leite, coalho, emb];\nconst un = ['L', 'ml', 'un'];\n"
               "const out = { f: f, rende: (10 * f) + ' un · custo R$ ' + (142 * f).toFixed(2).replace('.', ','), editando: !feito, feito: feito,\n"
               "  menos: () => this.setState({ f: Math.max(1, f - 1) }), mais: () => this.setState({ f: Math.min(6, f + 1) }), criar: () => this.setState({ feito: true }), desfazer: () => this.setState({ feito: false }) };\n"
               "let falta = [];\npre.forEach((p, i) => { out['n' + i] = p + ' ' + un[i]; out['t' + i] = tem[i] + ' ' + un[i]; out['ok' + i] = p <= tem[i]; out['fa' + i] = p > tem[i]; out['ft' + i] = 'Faltam ' + (p - tem[i]) + ' ' + un[i]; if (p > tem[i]) falta.push(i); });\n"
               "const soLeite = falta.length === 1 && falta[0] === 0 && leite - 18 <= 140;\n"
               "out.aviso = falta.length === 0 ? 'Os insumos ficam reservados para esta ordem.' : soLeite ? 'O leite que falta chega hoje no PC-0057 (140 L). A ordem pode ser criada.' : 'Faltam insumos: a ordem fica planejada até a compra chegar.';\n"
               "out.resumo = (10 * f) + ' un de Queijo coalho · começa amanhã às 08h · ' + leite + ' L de leite, ' + coalho + ' ml de coalho e ' + emb + ' embalagens reservados';\nreturn out;\n}")
gphone('Gestao-Ficha.dc.html', 'Bodeleve — gestão: ficha técnica', 1720, ficha, logic_ficha)

# ---------- Ordem (apontamento) ----------
CONS = [  # nome, previsto, passo, unidade, custo unitário, casas
    ('Leite integral', 80, 1, 'L', 3.10, 0), ('Coalho líquido', 40, 5, 'ml', 0.25, 0), ('Sal', 1.0, 0.1, 'kg', 4.00, 1), ('Embalagem a vácuo', 20, 1, 'un', 0.80, 0)]
def crow(i):
    n, p, s, u, c, d = CONS[i]
    pv = (('%.' + str(d) + 'f') % p).replace('.', ',')
    return (f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-bottom: 1px solid {LN}">'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-weight: 600">{n}</span>'
            f'<sc-if value="{H("ok" + str(i))}" hint-placeholder-val="{H("true")}">{tagc("Como previsto", OK_T, OK_B)}</sc-if><sc-if value="{H("df" + str(i))}" hint-placeholder-val="{H("false")}">{tagc(H("dt" + str(i)), AT_T, AT_B)}</sc-if></div>'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-size: 14px; line-height: 20px; color: {G2}; {NUM}">Previsto {pv} {u}</span>'
            + stepper('Consumo real de ' + n, H('m' + str(i)), H('p' + str(i)), H('q' + str(i)), True) + '</div></div>')
etapas3 = ''.join(f'<span aria-hidden="true" style="flex: 1 1 0; height: 6px; border-radius: 999px; background: {H("e" + str(i))}"></span>' for i in range(3))
ordem = (bar('OP-0032', 'Gestao-Producao.dc.html')
    + f'<sc-if value="{H("apontando")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; gap: 6px">{etapas3}</div>'
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Queijo coalho 500 g</div>'
    f'<div style="{SM}; {NUM}">2 fornadas · previsto 20 un · para estoque · iniciada hoje 09h, termina 18h</div></div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Consumo real")}<div style="{SM}">Ajuste se usou mais ou menos que a ficha.</div>'
    + box(''.join(crow(i) for i in range(len(CONS))), 'padding-top: 0; padding-bottom: 0') + '</section>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Rendimento")}'
    f'<div style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 10px">'
    f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span><b>Unidades boas</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}; {NUM}">previsto 20 · {H("rend")}</span></span>'
    + stepper('Unidades produzidas', H('rm'), H('rp'), H('r')) + '</div>'
    f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">' + campo('lot', 'Lote', 'QC-1115') + campo('val', 'Validade', '04/12/2026') + '</div></div></section>'
    + card(li('Custo previsto / un', 'R$ 14,20') + f'<div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid {LN}; font-weight: 600; {NUM}"><span>Custo real / un</span><span>{H("custo")}</span></div>')
    + '</main>' + rodape(f'<button type="button" onClick="{H("concluir")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}; width: 100%">Concluir produção</button>') + '</sc-if>'
    f'<sc-if value="{H("feito")}" hint-placeholder-val="{H("false")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 24px 16px">'
    f'<div style="display: flex; gap: 6px">{etapas3}</div>'
    f'<div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px"><div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("confirmar", 32)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Produção concluída</h1></div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; gap: 8px; align-items: center">{icon("adicionar", 20, OK_T)}<b>Entrou no estoque</b></div>'
    + card(f'<div style="display: flex; justify-content: space-between; gap: 12px; {NUM}"><span><b>Queijo coalho 500 g</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">Lote QC-1115 · vence 04/12/2026</span></span><b style="color: {OK_T}">+ {H("r")} un</b></div>') + '</section>'
    f'<section style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; gap: 8px; align-items: center">{icon("remover", 20, G2)}<b>Saiu do estoque (insumos)</b></div>'
    + card(''.join(li(CONS[i][0], H('q' + str(i)) + ' ' + CONS[i][3]) for i in range(len(CONS)))) + '</section>'
    + card(li('Custo real / un', H('custo')) + li('Perda na produção', H('perda'))) + '</main>'
    + rodape(cta('Ver estoque do queijo', 'Gestao-EstoqueItem.dc.html') + f'<button type="button" onClick="{H("desfazer")}" style="height: 48px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}">Corrigir apontamento</button>') + '</sc-if>')
logic_ordem = ('renderVals() {\n' + FMT + "\nconst P = [" + ', '.join(str(c[1]) for c in CONS) + "];\nconst S = [" + ', '.join(str(c[2]) for c in CONS) + "];\nconst CU = [" + ', '.join(str(c[4]) for c in CONS) + "];\nconst D = [" + ', '.join(str(c[5]) for c in CONS) + "];\nconst U = [" + ', '.join("'" + c[3] + "'" for c in CONS) + "];\n"
               "const st = this.state || {};\nconst q = st.q || P.slice();\nconst r = st.r === undefined ? 19 : st.r;\nconst feito = !!st.feito;\n"
               f"const on = '{T}', off = '{LN}', ok = '{V}';\n"
               "const num = (v, d) => v.toFixed(d).replace('.', ',');\n"
               "const chg = (i, s) => () => { const c = q.slice(); c[i] = Math.max(0, Math.round((c[i] + s * S[i]) * 100) / 100); this.setState({ q: c }); };\n"
               "const total = q.reduce((a, b, i) => a + b * CU[i], 0) + 6;\n"
               "const out = { apontando: !feito, feito: feito, r: r, rend: Math.round(r / 20 * 100) + '% do previsto', custo: r > 0 ? fmt(total / r) : '—', perda: (20 - r) + ' un',\n"
               "  rm: () => this.setState({ r: Math.max(0, r - 1) }), rp: () => this.setState({ r: Math.min(24, r + 1) }), concluir: () => this.setState({ feito: true }), desfazer: () => this.setState({ feito: false }) };\n"
               "q.forEach((v, i) => { const d = Math.round((v - P[i]) * 100) / 100; out['q' + i] = num(v, D[i]); out['ok' + i] = d === 0; out['df' + i] = d !== 0; out['dt' + i] = (d > 0 ? '+' : '−') + num(Math.abs(d), D[i]) + ' ' + U[i]; out['m' + i] = chg(i, -1); out['p' + i] = chg(i, 1); });\n"
               "[0, 1, 2].forEach((i) => { const p = feito ? 2 : 1; out['e' + i] = i < p ? ok : i === p ? on : off; });\nreturn out;\n}")
gphone('Gestao-Ordem.dc.html', 'Bodeleve — gestão: ordem de produção', 1460, ordem, logic_ordem)
