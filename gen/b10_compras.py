from b9_gestao1 import *   # regenera o lote 1 da gestão (hub Mais com links) e traz os auxiliares

def stepper(label, minus, plus, val, small=False):
    s = 40 if small else 44
    b = lambda l, ic, on, fg, bg, bd: (f'<button type="button" aria-label="{l}" onClick="{on}" style="flex: none; width: {s}px; height: {s}px; border-radius: 12px; border: {bd}; background: {bg}; '
                                       f'color: {fg}; display: inline-flex; align-items: center; justify-content: center">{icon(ic, 20)}</button>')
    return (f'<div role="group" aria-label="{label}" style="display: inline-flex; align-items: center; gap: 2px">' + b('Diminuir', 'remover', minus, G, C, f'1px solid {LN}')
            + f'<div aria-live="polite" style="min-width: 36px; text-align: center; font-weight: 600; {NUM}">{val}</div>' + b('Aumentar', 'adicionar', plus, W, T, '0') + '</div>')
li = lambda a, b: f'<div style="display: flex; justify-content: space-between; gap: 12px; color: {G2}; {NUM}"><span>{a}</span><span>{b}</span></div>'
card = lambda inner, extra='': f'<div style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {extra}">{inner}</div>'
rodape = lambda inner: f'<div style="margin-top: auto; flex: none; padding: 12px 16px 16px; background: {W}; border-top: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px">{inner}</div>'
cta2 = lambda t, href: f'<a href="{href}" style="height: 48px; padding: 0 20px; border-radius: 12px; border: 1.5px solid {G}; color: {G}; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 600">{t}</a>'
FMT = "const fmt = (v) => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');"

# ---------- Compras (lista) ----------
PCS = [  # num, fornecedor, linha, total, tag, aba, href
    ('PC-0057', 'Laticínios Serra Verde', 'Chega hoje · 3 itens', 'R$ 632,40', tagc('Chega hoje', AT_T, AT_B), 0, 'Gestao-Compra.dc.html'),
    ('PC-0056', 'Moinho Sertão', 'Chega 18/11 · 4 itens', 'R$ 486,00', tagc('Enviado', IN_T, IN_B), 0, None),
    ('PC-0055', 'Charqueada Norte', 'Chega 19/11 · 2 itens', 'R$ 718,00', tagc('Enviado', IN_T, IN_B), 0, None),
    ('PC-0054', 'Moinho Sertão', 'Recebido 07/11 · 4 itens', 'R$ 512,00', tagc('Recebido', OK_T, OK_B), 1, None),
    ('PC-0053', 'Laticínios Serra Verde', 'Recebido 31/10 · faltou 1 item', 'R$ 420,00', tagc('Recebido parcial', AT_T, AT_B), 1, None),
]
def pccard(i):
    n, f, l, t, tag, aba, href = PCS[i]
    inner = (f'<span style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-weight: 600; font-size: 17px">{f}</span>{tag}</span>'
             f'<span style="display: flex; justify-content: space-between; gap: 8px; font-size: 14px; line-height: 20px; {NUM}"><span style="color: {G2}">{n} · {l}</span><b>{t}</b></span>')
    st = f'padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; text-decoration: none; color: {G}; display: flex; flex-direction: column; gap: 6px'
    c = f'<a href="{href}" style="{st}">{inner}</a>' if href else f'<div style="{st}">{inner}</div>'
    return f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true" if aba == 0 else "false")}">{c}</sc-if>'
def ptab(i, t, n):
    return (f'<button type="button" aria-pressed="{H("a" + str(i))}" onClick="{H("t" + str(i))}" style="flex: none; height: 40px; padding: 0 14px; border-radius: 999px; border: 1.5px solid {G}; '
            f'background: {H("b" + str(i))}; color: {H("c" + str(i))}; font: 600 14px {FB}; {NUM}">{t} · {n}</button>')
compras = (bar('Compras', 'Gestao-Mais.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    + cta('<span style="display: inline-flex">' + icon('adicionar', 20) + '</span>Novo pedido de compra', 'Gestao-CompraNova.dc.html', 'height: 48px')
    + f'<div role="group" aria-label="Filtrar pedidos de compra" style="display: flex; gap: 8px">{ptab(0, "Em aberto", 3)}{ptab(1, "Recebidos", 2)}</div>'
    + '<div style="display: flex; flex-direction: column; gap: 10px">' + ''.join(pccard(i) for i in range(len(PCS))) + '</div>'
    + f'<a href="Gestao-Fornecedores.dc.html" style="align-self: flex-start; min-height: 44px; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; text-decoration: none">Ver fornecedores{icon("avancar", 18)}</a></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(4)}</div>')
logic_compras = ("renderVals() {\nconst A = [" + ', '.join(str(p[5]) for p in PCS) + "];\nconst t = (this.state && this.state.t) || 0;\nconst out = {};\nA.forEach((a, i) => { out['v' + i] = a === t; });\n"
                 "[0, 1].forEach((k) => { out['a' + k] = t === k; out['b' + k] = t === k ? '" + G + "' : '" + W + "'; out['c' + k] = t === k ? '" + W + "' : '" + G + "'; out['t' + k] = () => this.setState({ t: k }); });\nreturn out;\n}")
gphone('Gestao-Compras.dc.html', 'Bodeleve — gestão: compras', 820, compras, logic_compras)

# ---------- Novo pedido de compra ----------
NOVO = [('Rapadura 400 g', 'Estoque 4 un · mínimo 12', 7.80, True), ('Melaço de cana 500 ml', 'Estoque 6 un · mínimo 6', 9.50, True), ('Açúcar mascavo 1 kg', 'Estoque 10 un · ok', 8.20, False)]
def nitem(i):
    n, est, c, baixo = NOVO[i]
    tag = tagc('Estoque baixo', AT_T, AT_B) if baixo else ''
    return (f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px 0; border-bottom: 1px solid {LN}">'
            f'<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px"><div><div style="font-weight: 600">{n}</div>'
            f'<div style="font-size: 13px; line-height: 18px; color: {G2}; {NUM}">{est} · último custo {("R$ %.2f" % c).replace(".", ",")}</div></div>{tag}</div>'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">' + stepper('Quantidade de ' + n, H('m' + str(i)), H('p' + str(i)), H('q' + str(i)), True)
            + f'<span style="font-weight: 600; {NUM}">{H("s" + str(i))}</span></div></div>')
nova = (bar('Novo pedido de compra', 'Gestao-Compras.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="forn" style="font-size: 14px; line-height: 20px; font-weight: 600">Fornecedor</label>'
    f'<select id="forn" style="height: 48px; padding: 0 12px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}"><option>Engenho Boa Vista</option><option>Laticínios Serra Verde</option><option>Moinho Sertão</option><option>Charqueada Norte</option></select></div>'
    f'<section style="display: flex; flex-direction: column; gap: 4px"><div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px">{h2("Itens")}<span style="{SM}">Sugestão pelo estoque mínimo</span></div>'
    + box(''.join(nitem(i) for i in range(3)).replace(f'border-bottom: 1px solid {LN}">', '">', 0), 'padding-bottom: 0') + '</section>'
    + campo('prev', 'Previsão de chegada', '20/11/2026')
    + f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="cond" style="font-size: 14px; line-height: 20px; font-weight: 600">Pagamento</label>'
      f'<select id="cond" style="height: 48px; padding: 0 12px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}"><option>Boleto, 14 dias após receber</option><option>Pix na entrega</option><option>Dinheiro na entrega</option></select></div>'
    + card(li('Itens', H('nitens')) + f'<div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid {LN}; font-weight: 600; font-size: 18px; {NUM}"><span>Total previsto</span><span>{H("total")}</span></div>')
    + '</main>'
    + rodape(cta('Enviar ao fornecedor', 'Gestao-Compras.dc.html') + f'<div style="{SM}; text-align: center">Envia o pedido pelo WhatsApp do fornecedor e salva como “Enviado”.</div>'))
logic_nova = ('renderVals() {\n' + FMT + "\nconst C = [7.8, 9.5, 8.2];\nconst q = (this.state && this.state.q) || [24, 6, 0];\n"
              "const chg = (i, d) => () => { const c = q.slice(); c[i] = Math.max(0, c[i] + d); this.setState({ q: c }); };\n"
              "const n = q.reduce((a, b) => a + b, 0);\nconst out = { nitens: n + ' un', total: fmt(q.reduce((a, b, i) => a + b * C[i], 0)) };\n"
              "q.forEach((v, i) => { out['q' + i] = v; out['s' + i] = fmt(v * C[i]); out['m' + i] = chg(i, -1); out['p' + i] = chg(i, 1); });\nreturn out;\n}")
gphone('Gestao-CompraNova.dc.html', 'Bodeleve — gestão: novo pedido de compra', 1180, nova, logic_nova)

# ---------- Detalhe do pedido de compra ----------
ITS = [('Leite integral 1 L', 140, 3.10), ('Requeijão 250 g', 20, 6.80), ('Nata 200 g', 12, 5.20)]
brl = lambda v: ('R$ %.2f' % v).replace('.', ',')
det = (bar('PC-0057', 'Gestao-Compras.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; flex-direction: column; gap: 6px"><div>{tagc("Chega hoje", AT_T, AT_B)}</div><div style="font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Laticínios Serra Verde</div>'
    f'<div style="{SM}; {NUM}">Pedido enviado em 11/11 pelo WhatsApp · previsão 14/11</div></div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Itens pedidos")}'
    + box(''.join(f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}"><div><div style="font-weight: 600">{n}</div>'
                  f'<div style="font-size: 13px; line-height: 18px; color: {G2}">{q} un × {brl(c)}</div></div><div style="font-weight: 600">{brl(q * c)}</div></div>' for n, q, c in ITS)
          + f'<div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: 600; font-size: 18px; {NUM}"><span>Total</span><span>R$ 632,40</span></div>') + '</section>'
    + card(f'<div style="font-weight: 600">Pagamento</div><div style="color: {G2}">Boleto, 14 dias após receber. A conta a pagar é criada no recebimento, com o valor do que chegou.</div>')
    + '</main>'
    + rodape(cta('Receber mercadoria', 'Gestao-Recebimento.dc.html') + cta2('Ver fornecedor', 'Gestao-Fornecedores.dc.html')))
gphone('Gestao-Compra.dc.html', 'Bodeleve — gestão: pedido de compra', 940, det, VAZIO)

# ---------- Recebimento ----------
LOTES = [('LT-1120', '21/11/2026'), ('RQ-1118', '20/12/2026'), ('NT-1114', '24/11/2026')]
def ritem(i):
    n, q, c = ITS[i]
    lt, vd = LOTES[i]
    return (f'<div style="display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
            f'<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px"><div><div style="font-weight: 600">{n}</div><div style="font-size: 13px; line-height: 18px; color: {G2}; {NUM}">Pedido: {q} un</div></div>'
            f'<sc-if value="{H("ok" + str(i))}" hint-placeholder-val="{H("true")}">{tagc("Confere", OK_T, OK_B)}</sc-if><sc-if value="{H("fa" + str(i))}" hint-placeholder-val="{H("false")}">{tagc(H("df" + str(i)), AT_T, AT_B)}</sc-if></div>'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span id="rl{i}" style="font-weight: 600">Recebido</span>' + stepper('Quantidade recebida de ' + n, H('m' + str(i)), H('p' + str(i)), H('q' + str(i))) + '</div>'
            f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">' + campo('lt' + str(i), 'Lote', lt) + campo('vd' + str(i), 'Validade', vd) + '</div></div>')
etapa_conf = (f'<sc-if value="{H("conferindo")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 12px; padding: 16px 16px 24px">'
    f'<div style="{SM}">Confira cada item com a nota. Informe lote e validade como estão na embalagem.</div>'
    + ''.join(ritem(i) for i in range(3))
    + card(li('Valor da nota', H('valor')) + li('Itens completos', H('completos')), '') + '</main>'
    + rodape(f'<button type="button" onClick="{H("confirmar")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}; width: 100%">Confirmar recebimento</button>') + '</sc-if>')
def ent(i):
    n, q, c = ITS[i]
    lt, vd = LOTES[i]
    return (f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid {LN}; {NUM}"><div><div style="font-weight: 600">{n}</div>'
            f'<div style="font-size: 13px; line-height: 18px; color: {G2}">Lote {lt} · vence {vd}</div></div><div style="font-weight: 600; color: {OK_T}">+ {H("q" + str(i))} un</div></div>')
etapa_ok = (f'<sc-if value="{H("feito")}" hint-placeholder-val="{H("false")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 24px 16px">'
    f'<div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px"><div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("confirmar", 32)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Recebimento confirmado</h1></div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; gap: 8px; align-items: center">{icon("estoque", 20, G2)}<b>Entrou no estoque</b></div>' + box(''.join(ent(i) for i in range(3)), 'padding-bottom: 0') + '</section>'
    f'<section style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; gap: 8px; align-items: center">{icon("financeiro", 20, G2)}<b>Conta a pagar criada</b></div>'
    + card(li('Laticínios Serra Verde · boleto', H('valor')) + li('Vencimento', '28/11/2026')) + '</section>'
    f'<sc-if value="{H("faltou")}" hint-placeholder-val="{H("true")}"><fieldset style="margin: 0; padding: 16px; border-radius: 12px; background: {AT_B}; border: 0; display: flex; flex-direction: column; gap: 8px">'
    f'<legend style="float: left; padding: 0; font-weight: 600; color: {AT_T}">{H("faltaTxt")}</legend>'
    + ''.join(f'<label for="o{k}" style="clear: both; display: flex; align-items: center; gap: 12px; min-height: 44px"><input id="o{k}" type="radio" name="falta"{" checked" if k == 0 else ""} style="width: 22px; height: 22px; accent-color: {T}; margin: 0"><span>{t}</span></label>'
              for k, t in enumerate(['Manter o restante em aberto no pedido', 'Encerrar o pedido assim'])) + '</fieldset></sc-if></main>'
    + rodape(cta('Voltar às compras', 'Gestao-Compras.dc.html') + f'<button type="button" onClick="{H("desfazer")}" style="height: 48px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}">Corrigir conferência</button>') + '</sc-if>')
receb = bar('Receber PC-0057', 'Gestao-Compra.dc.html') + etapa_conf + etapa_ok
logic_receb = ('renderVals() {\n' + FMT + "\nconst P = [140, 20, 12];\nconst C = [3.1, 6.8, 5.2];\nconst N = ['Leite integral', 'Requeijão', 'Nata'];\nconst st = this.state || {};\nconst q = st.q || [140, 20, 10];\nconst feito = !!st.feito;\n"
               "const chg = (i, d) => () => { const c = q.slice(); c[i] = Math.max(0, c[i] + d); this.setState({ q: c }); };\n"
               "const falta = P.map((p, i) => Math.max(0, p - q[i]));\nconst nc = falta.filter((f) => f === 0).length;\n"
               "const fl = falta.map((f, i) => f > 0 ? f + ' un de ' + N[i] : '').filter(Boolean);\n"
               "const out = { conferindo: !feito, feito: feito, valor: fmt(q.reduce((a, b, i) => a + b * C[i], 0)), completos: nc + ' de 3', faltou: fl.length > 0, faltaTxt: 'Faltaram ' + fl.join(' e ') + '. O que fazer?',\n"
               "  confirmar: () => this.setState({ feito: true }), desfazer: () => this.setState({ feito: false }) };\n"
               "q.forEach((v, i) => { const d = v - P[i]; out['q' + i] = v; out['ok' + i] = d === 0; out['fa' + i] = d !== 0; out['df' + i] = d < 0 ? 'Faltam ' + (-d) : 'Sobram ' + d; out['m' + i] = chg(i, -1); out['p' + i] = chg(i, 1); });\nreturn out;\n}")
gphone('Gestao-Recebimento.dc.html', 'Bodeleve — gestão: recebimento', 1240, receb, logic_receb)

# ---------- Fornecedores ----------
FS = [('Engenho Boa Vista', 'Rapadura, melaço, açúcar', 'Última compra 28/10', 'Gestao-Fornecedor.dc.html'),
      ('Laticínios Serra Verde', 'Leite, requeijão, nata', '1 pedido chega hoje', None), ('Moinho Sertão', 'Farinhas, tapioca, flocão', '1 pedido em aberto', None), ('Charqueada Norte', 'Carne de sol, charque', '1 pedido em aberto', None)]
def frow(i):
    n, cat, s, href = FS[i]
    bd = '' if i == len(FS) - 1 else f'border-bottom: 1px solid {LN}; '
    inner = (f'<span aria-hidden="true" style="flex: none; width: 40px; height: 40px; border-radius: 999px; background: {C}; display: flex; align-items: center; justify-content: center; font-weight: 700">{n[0]}</span>'
             f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{n}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{cat} · {s}</span></span>')
    st = f'display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 8px 0; {bd}text-decoration: none; color: {G}'
    return f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>' if href else f'<div style="{st}">{inner}</div>'
forns = (bar('Fornecedores', 'Gestao-Mais.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 16px; border-radius: 999px; background: {W}; border: 1.5px solid {LN}; color: {G2}">{icon("buscar", 20)}'
    f'<input type="search" aria-label="Buscar fornecedor" placeholder="Buscar fornecedor" style="flex: 1 1 0; min-width: 0; border: 0; background: transparent; font: 400 16px {FB}; color: {G}; outline: none"></div>'
    + box(''.join(frow(i) for i in range(len(FS)))) + f'<div style="{SM}">4 fornecedores ativos</div></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(4)}</div>')
gphone('Gestao-Fornecedores.dc.html', 'Bodeleve — gestão: fornecedores', 700, forns, VAZIO)

# ---------- Fornecedor ----------
forn = (bar('Fornecedor', 'Gestao-Fornecedores.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div><div style="font-family: {FD}; font-weight: 700; font-size: 26px; line-height: 32px">Engenho Boa Vista</div><div style="{SM}">Rapadura, melaço, açúcar · fornecedor desde 2024</div></div>'
    + card(f'<div style="font-weight: 600">Contato</div><div style="color: {G2}; {NUM}">Seu Antônio · (00) 90000-0100<br>[E-MAIL] · [CNPJ OU CPF]</div>')
    + f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Produtos que fornece")}'
    + box(''.join(f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}"><span>{n}</span><span style="color: {G2}">último custo {c}</span></div>'
                  for n, c in (('Rapadura 400 g', 'R$ 7,80'), ('Melaço de cana 500 ml', 'R$ 9,50'), ('Açúcar mascavo 1 kg', 'R$ 8,20'))).replace(f'border-bottom: 1px solid {LN}; ', '', 0), 'padding-bottom: 0') + '</section>'
    + card(li('Pagamento padrão', 'Boleto, 14 dias') + li('Prazo de entrega', '3 a 5 dias') + li('Comprado em 2026', 'R$ 2.946,00') + li('Contas em aberto', 'nenhuma'))
    + f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Últimos pedidos")}'
    + box(''.join(f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}"><span><b>{n}</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{d}</span></span><span>{v}</span></div>'
                  for n, d, v in (('PC-0049', 'Recebido 28/10', 'R$ 236,40'), ('PC-0038', 'Recebido 26/09', 'R$ 312,00'))), 'padding-bottom: 0') + '</section></main>'
    + rodape(cta('Novo pedido para este fornecedor', 'Gestao-CompraNova.dc.html')))
gphone('Gestao-Fornecedor.dc.html', 'Bodeleve — gestão: fornecedor', 1080, forn, VAZIO)
