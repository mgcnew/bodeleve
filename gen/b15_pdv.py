from b14_gestao6 import *   # regenera a gestão e traz os auxiliares

PNAV = [('vender', 'Vender', 'PDV-Vender.dc.html'), ('historico', 'Vendas', 'PDV-Vendas.dc.html'), ('caixa', 'Caixa', 'PDV-Caixa.dc.html')]
def pnav(active):
    cells = ''
    for i, (ic, t, href) in enumerate(PNAV):
        on = i == active
        cur = 'aria-current="page" ' if on else ''
        cells += (f'<a href="{href}" {cur}style="flex: 1 1 0; min-width: 0; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-decoration: none; '
                  f'color: {T if on else G2}; font-size: 12px; line-height: 16px; font-weight: {700 if on else 500}">{icon(ic)}<span>{t}</span></a>')
    return f'<nav aria-label="Navegação do caixa" style="flex: none; display: flex; background: {W}; border-top: 1px solid {LN}">{cells}</nav>'
caixa_head = lambda: (f'<header style="flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; background: {W}; border-bottom: 1px solid {LN}">'
                      f'<div><div style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">Balcão</div><div style="font-size: 13px; line-height: 18px; color: {G2}">Caixa aberto · Júlia · desde 08h02</div></div>'
                      f'{tagc("Aberto", OK_T, OK_B)}</header>')
BIG = lambda t, on, extra='': f'<button type="button" onClick="{on}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 18px {FB}; width: 100%; {NUM}; {extra}">{t}</button>'
BIGA = lambda t, href: f'<a href="{href}" style="height: 56px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px; {NUM}">{t}</a>'
SEC = lambda t, on: f'<button type="button" onClick="{on}" style="height: 48px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}; width: 100%">{t}</button>'
SECA = lambda t, href: f'<a href="{href}" style="height: 48px; border-radius: 12px; border: 1.5px solid {G}; color: {G}; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 600">{t}</a>'
CHIP = lambda t, on, active: (f'<button type="button" aria-pressed="{H(active)}" onClick="{H(on)}" style="flex: 1 1 0; min-width: 0; height: 48px; border-radius: 12px; border: 1.5px solid {G}; '
                              f'background: {H(active + "B")}; color: {H(active + "C")}; font: 600 16px {FB}; {NUM}">{t}</button>')
def chip_vals(name, cond):
    return f"out.{name} = {cond}; out.{name}B = ({cond}) ? '{G}' : '{W}'; out.{name}C = ({cond}) ? '{W}' : '{G}';\n"
sheet_wrap = lambda cond, inner, label: (f'<sc-if value="{H(cond)}" hint-placeholder-val="{H("false")}"><div style="position: absolute; inset: 0; background: rgba(41,38,33,0.45); display: flex; flex-direction: column; justify-content: flex-end">'
                                         f'<div role="dialog" aria-modal="true" aria-label="{label}" style="background: {W}; border-radius: 20px 20px 0 0; padding: 12px 20px 20px; display: flex; flex-direction: column; gap: 16px">'
                                         f'<div aria-hidden="true" style="align-self: center; width: 40px; height: 4px; border-radius: 999px; background: {LN}"></div>{inner}</div></div></sc-if>')
JSFMT = "const fmt = (v) => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');\n"

# ---------- Abertura de caixa ----------
abre = (f'<main style="flex: 1 1 0; display: flex; flex-direction: column; gap: 20px; padding: 24px 16px">'
    f'<div><div style="font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px">Abrir caixa</div><div style="{SM}">Balcão · sábado, 14/11 · 08h02</div></div>'
    + card(li('Quem abre', 'Júlia') + li('Último fechamento', '13/11 · sem diferença'))
    + f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="fundo" style="font-size: 14px; line-height: 20px; font-weight: 600">Dinheiro na gaveta para troco</label>'
      f'<input id="fundo" type="text" inputmode="decimal" value="{H("fundo")}" readonly style="height: 56px; padding: 0 16px; border-radius: 8px; border: 2px solid {G}; background: {W}; color: {G}; font: 600 22px {FB}; {NUM}; box-sizing: border-box; width: 100%"></div>'
    + f'<div role="group" aria-label="Valores comuns" style="display: flex; gap: 8px">' + CHIP('R$ 100', 'f0', 'c0') + CHIP('R$ 150', 'f1', 'c1') + CHIP('R$ 200', 'f2', 'c2') + '</div>'
    + f'<div style="{SM}">Conte o dinheiro antes de abrir. Esse valor é a base para conferir o caixa no fechamento.</div></main>'
    + rodape(BIGA('Abrir caixa', 'PDV-Vender.dc.html')))
logic_abre = ("renderVals() {\n" + JSFMT + "const st = this.state || {};\nconst v = st.v === undefined ? 150 : st.v;\nconst out = { fundo: fmt(v) };\n"
              + chip_vals('c0', 'v === 100') + chip_vals('c1', 'v === 150') + chip_vals('c2', 'v === 200')
              + "out.f0 = () => this.setState({ v: 100 }); out.f1 = () => this.setState({ v: 150 }); out.f2 = () => this.setState({ v: 200 });\nreturn out;\n}")
gphone('PDV-Abertura.dc.html', 'Bodeleve — PDV: abrir caixa', 760, abre, logic_abre)

# ---------- Vender (favoritos, categorias, busca, peso, sacola) ----------
tile = (f'<button type="button" aria-label="{{{{ p.aria }}}}" onClick="{{{{ p.tap }}}}" style="height: 104px; padding: 12px; border-radius: 12px; border: 1px solid {LN}; background: {W}; color: {G}; text-align: left; '
        f'display: flex; flex-direction: column; justify-content: space-between; font: 400 14px {FB}; min-width: 0">'
        f'<span style="font-weight: 600; font-size: 15px; line-height: 20px">{{{{ p.nome }}}}</span>'
        f'<span style="display: flex; justify-content: space-between; align-items: baseline; gap: 4px; {NUM}"><span style="font-weight: 700; font-size: 16px">{{{{ p.preco }}}}</span>'
        f'<span style="font-size: 12px; color: {{{{ p.cor }}}}; font-weight: {{{{ p.peso }}}}">{{{{ p.est }}}}</span></span></button>')
def ptab(i, t):
    return (f'<button type="button" role="tab" aria-selected="{H("ta" + str(i))}" onClick="{H("tab" + str(i))}" style="flex: 1 1 0; height: 48px; border: 0; background: transparent; '
            f'border-bottom: 3px solid {H("tb" + str(i))}; color: {H("tc" + str(i))}; font: 600 15px {FB}">{t}</button>')
peso_sheet = sheet_wrap('sheet',
    f'<div><div style="font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 28px">{H("sNome")}</div><div style="{SM}; {NUM}">{H("sPreco")}</div></div>'
    f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px"><span id="pl" style="font-weight: 600">Peso</span>'
    + stepper('Peso em gramas', H('pMenos'), H('pMais'), H('sPeso')) + '</div>'
    + f'<div role="group" aria-label="Pesos comuns" style="display: flex; gap: 8px">' + CHIP('250 g', 'g0', 'k0') + CHIP('500 g', 'g1', 'k1') + CHIP('1 kg', 'g2', 'k2') + '</div>'
    + BIG(f'Adicionar · {H("sTotal")}', H('addPeso')) + SEC('Cancelar', H('fechar')), 'Informar peso')
vender = (f'<div style="position: relative; flex: 1 1 0; display: flex; flex-direction: column; min-height: 0">' + caixa_head()
    + f'<div role="tablist" style="flex: none; display: flex; background: {W}; border-bottom: 1px solid {LN}">{ptab(0, "Favoritos")}{ptab(1, "Categorias")}{ptab(2, "Buscar")}</div>'
    + f'<main style="flex: 1 1 0; display: flex; flex-direction: column; gap: 12px; padding: 12px 16px">'
    f'<sc-if value="{H("isCat")}" hint-placeholder-val="{H("false")}"><div role="group" aria-label="Categoria" style="display: flex; gap: 8px; flex-wrap: wrap">'
    + ''.join(f'<button type="button" aria-pressed="{H("ca" + str(k))}" onClick="{H("cat" + str(k))}" style="height: 44px; padding: 0 14px; border-radius: 999px; border: 1.5px solid {G}; background: {H("cb" + str(k))}; color: {H("cc" + str(k))}; font: 600 14px {FB}">{t}</button>'
              for k, t in enumerate(['Laticínios', 'Carnes', 'Farinhas e grãos', 'Doces'])) + '</div></sc-if>'
    f'<sc-if value="{H("isBusca")}" hint-placeholder-val="{H("false")}"><div style="display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 16px; border-radius: 999px; background: {W}; border: 1.5px solid {G}; color: {G2}">{icon("buscar", 20)}'
    f'<input type="search" aria-label="Buscar produto" placeholder="Nome do produto" onChange="{H("onBusca")}" style="flex: 1 1 0; min-width: 0; border: 0; background: transparent; font: 400 16px {FB}; color: {G}; outline: none"></div></sc-if>'
    f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px"><sc-for list="{H("prods")}" as="p" hint-placeholder-count="8">{tile}</sc-for></div>'
    f'<sc-if value="{H("vazio")}" hint-placeholder-val="{H("false")}"><div style="{SM}; text-align: center; padding: 24px 0">Nenhum produto com esse nome.</div></sc-if>'
    f'<div style="{SM}">Toque para somar 1. Produtos por peso pedem o peso antes.</div></main>'
    + f'<div style="flex: none; display: flex; flex-direction: column">'
    f'<sc-if value="{H("tem")}" hint-placeholder-val="{H("false")}"><a href="PDV-Sacola.dc.html" style="margin: 0 12px 12px; height: 56px; padding: 0 16px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: flex; align-items: center; gap: 12px; font-weight: 600">'
    f'{icon("sacola")}<span style="flex: 1 1 0">Sacola · {H("itens")}</span><span style="{NUM}">{H("total")}</span></a></sc-if>' + pnav(0) + '</div>'
    + peso_sheet + '</div>')
logic_vender = ("renderVals() {\n" + JSFMT + "const st = this.state || {};\nconst tab = st.tab || 0;\nconst cat = st.cat || 0;\nconst q = (st.q || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');\nconst cart = st.cart || [];\n"
                "const P = [\n  { nome: 'Queijo coalho', preco: 32.9, kg: false, est: '12 un', baixo: false, cat: 0 },\n  { nome: 'Carne de sol', preco: 59.9, kg: true, est: '6,4 kg', baixo: false, cat: 1 },\n"
                "  { nome: 'Farinha de mandioca', preco: 12.9, kg: false, est: '26 un', baixo: false, cat: 2 },\n  { nome: 'Tapioca granulada', preco: 9.9, kg: false, est: '3 un', baixo: true, cat: 2 },\n"
                "  { nome: 'Rapadura', preco: 14.5, kg: false, est: '4 un', baixo: true, cat: 3 },\n  { nome: 'Manteiga de garrafa', preco: 28, kg: false, est: '11 un', baixo: false, cat: 0 },\n"
                "  { nome: 'Feijão de corda', preco: 16.9, kg: true, est: '9 kg', baixo: false, cat: 2 },\n  { nome: 'Doce de leite', preco: 18.9, kg: false, est: '9 un', baixo: false, cat: 3 }\n];\n"
                "const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');\n"
                "const vis = P.map((p, i) => ({ p: p, i: i })).filter((o) => tab === 0 || (tab === 1 && o.p.cat === cat) || (tab === 2 && (q === '' || norm(o.p.nome).indexOf(q) >= 0)));\n"
                "const add = (it) => this.setState({ cart: cart.concat([it]) });\n"
                f"const prods = vis.map((o) => ({{ nome: o.p.nome, preco: o.p.kg ? fmt(o.p.preco) + '/kg' : fmt(o.p.preco), est: o.p.est, cor: o.p.baixo ? '{AT_T}' : '{G2}', peso: o.p.baixo ? 700 : 400,\n"
                "  aria: o.p.nome + ', ' + (o.p.kg ? fmt(o.p.preco) + ' o quilo' : fmt(o.p.preco)) + ', estoque ' + o.p.est,\n"
                "  tap: () => { if (o.p.kg) { this.setState({ sheet: o.i + 1, g: 500 }); } else { add({ v: o.p.preco }); } } }));\n"
                "const total = cart.reduce((a, b) => a + b.v, 0);\nconst n = cart.length;\nconst sp = st.sheet ? P[st.sheet - 1] : P[1];\nconst g = st.g || 500;\n"
                "const out = { prods: prods, vazio: prods.length === 0, isCat: tab === 1, isBusca: tab === 2, tem: n > 0, itens: n + (n === 1 ? ' item' : ' itens'), total: fmt(total),\n"
                "  sheet: !!st.sheet, sNome: sp.nome, sPreco: fmt(sp.preco) + ' o quilo', sPeso: (g / 1000).toFixed(3).replace('.', ',') + ' kg', sTotal: fmt(sp.preco * g / 1000),\n"
                "  pMenos: () => this.setState({ g: Math.max(50, g - 50) }), pMais: () => this.setState({ g: g + 50 }), fechar: () => this.setState({ sheet: 0 }),\n"
                "  addPeso: () => this.setState({ cart: cart.concat([{ v: Math.round(sp.preco * g / 10) / 100 }]), sheet: 0 }),\n"
                "  g0: () => this.setState({ g: 250 }), g1: () => this.setState({ g: 500 }), g2: () => this.setState({ g: 1000 }),\n"
                "  onBusca: (e) => this.setState({ q: e.target.value }) };\n"
                + chip_vals('k0', 'g === 250') + chip_vals('k1', 'g === 500') + chip_vals('k2', 'g === 1000')
                + f"[0, 1, 2].forEach((k) => {{ out['ta' + k] = tab === k; out['tb' + k] = tab === k ? '{T}' : 'transparent'; out['tc' + k] = tab === k ? '{G}' : '{G2}'; out['tab' + k] = () => this.setState({{ tab: k }}); }});\n"
                f"[0, 1, 2, 3].forEach((k) => {{ out['ca' + k] = cat === k; out['cb' + k] = cat === k ? '{G}' : '{W}'; out['cc' + k] = cat === k ? '{W}' : '{G}'; out['cat' + k] = () => this.setState({{ cat: k }}); }});\n"
                "return out;\n}")
gphone('PDV-Vender.dc.html', 'Bodeleve — PDV: vender', 900, vender, logic_vender)

# ---------- Sacola (com desconto) ----------
SITENS = [('Queijo coalho', '32,90 cada', 32.90, 2, False), ('Carne de sol', '0,500 kg × R$ 59,90', 29.95, 1, True), ('Farinha de mandioca', '12,90 cada', 12.90, 1, False)]
def sitem(i):
    n, d, p, q, kg = SITENS[i]
    ctrl = (stepper('Quantidade de ' + n, H('m' + str(i)), H('p' + str(i)), H('q' + str(i)), True) if not kg
            else f'<button type="button" aria-label="Remover {n}" onClick="{H("r" + str(i))}" style="width: 44px; height: 44px; border-radius: 12px; border: 1px solid {LN}; background: {C}; color: {G}; display: inline-flex; align-items: center; justify-content: center">{icon("fechar", 18)}</button>')
    return (f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true")}"><div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}">'
            f'<span style="flex: 1 1 0; min-width: 0"><b>{n}</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{d}</span><span style="display: block; font-weight: 600">{H("s" + str(i))}</span></span>{ctrl}</div></sc-if>')
desc_sheet = sheet_wrap('dOpen',
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 28px">Desconto</div>'
    + f'<div role="group" aria-label="Valor do desconto" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">' + CHIP('5%', 'd0', 'x0') + CHIP('10%', 'd1', 'x1') + CHIP('R$ 5,00', 'd2', 'x2') + CHIP('Arredondar', 'd3', 'x3') + '</div>'
    + sel('mot', 'Motivo', ['Cliente da casa', 'Produto perto da validade', 'Arredondamento', 'Outro'])
    + f'<div style="{SM}; {NUM}">{H("dPrev")}</div>' + BIG('Aplicar desconto', H('aplicar')) + SEC('Cancelar', H('dFechar')), 'Dar desconto')
sacola = (f'<div style="position: relative; flex: 1 1 0; display: flex; flex-direction: column; min-height: 0">'
    + bar('Sacola', 'PDV-Vender.dc.html')
    + f'<main style="flex: 1 1 0; display: flex; flex-direction: column; gap: 16px; padding: 12px 16px 24px">'
    + box(''.join(sitem(i) for i in range(3)), 'padding-top: 0; padding-bottom: 0')
    + f'<a href="PDV-Vender.dc.html" style="align-self: flex-start; min-height: 44px; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; text-decoration: none">{icon("adicionar", 18)}Adicionar produto</a>'
    + card(li('Subtotal', H('sub')) + f'<sc-if value="{H("temDesc")}" hint-placeholder-val="{H("false")}">' + li(H('descLbl'), H('desc')) + '</sc-if>'
           + f'<div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid {LN}; font-weight: 700; font-size: 22px; {NUM}"><span>Total</span><span>{H("total")}</span></div>')
    + SEC('Dar desconto', H('dAbrir')) + '</main>'
    + rodape(BIGA(f'Cobrar {H("total")}', 'PDV-Pagamento.dc.html')) + desc_sheet + '</div>')
logic_sacola = ("renderVals() {\n" + JSFMT + "const st = this.state || {};\nconst P = [32.9, 29.95, 12.9];\nconst q = st.q || [2, 1, 1];\nconst d = st.d === undefined ? -1 : st.d;\nconst pd = st.pd === undefined ? 0 : st.pd;\n"
                "const sub = q.reduce((a, b, i) => a + b * P[i], 0);\n"
                "const calc = (k) => k === 0 ? Math.round(sub * 5) / 100 : k === 1 ? Math.round(sub * 10) / 100 : k === 2 ? 5 : Math.round((sub - Math.floor(sub)) * 100) / 100;\n"
                "const lbl = ['Desconto 5%', 'Desconto 10%', 'Desconto', 'Arredondamento'];\nconst desc = d >= 0 ? calc(d) : 0;\n"
                "const chg = (i, s) => () => { const c = q.slice(); c[i] = Math.max(0, c[i] + s); this.setState({ q: c }); };\n"
                "const out = { sub: fmt(sub), temDesc: d >= 0, descLbl: d >= 0 ? lbl[d] : '', desc: '− ' + fmt(desc), total: fmt(sub - desc), dOpen: !!st.open,\n"
                "  dAbrir: () => this.setState({ open: true }), dFechar: () => this.setState({ open: false }), aplicar: () => this.setState({ d: pd, open: false }),\n"
                "  dPrev: 'Desconto de ' + fmt(calc(pd)) + ' · total fica ' + fmt(sub - calc(pd)) };\n"
                "[0, 1, 2, 3].forEach((k) => { out['d' + k] = () => this.setState({ pd: k }); });\n"
                + chip_vals('x0', 'pd === 0') + chip_vals('x1', 'pd === 1') + chip_vals('x2', 'pd === 2') + chip_vals('x3', 'pd === 3')
                + "q.forEach((v, i) => { out['v' + i] = v > 0; out['q' + i] = v; out['s' + i] = fmt(v * P[i]); out['m' + i] = chg(i, -1); out['p' + i] = chg(i, 1); out['r' + i] = () => { const c = q.slice(); c[i] = 0; this.setState({ q: c }); }; });\nreturn out;\n}")
gphone('PDV-Sacola.dc.html', 'Bodeleve — PDV: sacola', 860, sacola, logic_sacola)

# ---------- Pagamento ----------
def mbtn(k, t, ic):
    return (f'<button type="button" aria-pressed="{H("ma" + str(k))}" onClick="{H("mt" + str(k))}" style="height: 72px; border-radius: 12px; border: {H("mb" + str(k))}; background: {W}; color: {G}; '
            f'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font: 600 16px {FB}">{icon(ic, 22)}<span>{t}</span></button>')
pag = (bar('Pagamento', 'PDV-Sacola.dc.html')
    + f'<main style="flex: 1 1 0; display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="text-align: center"><div style="{SM}">Total a cobrar</div><div style="font-family: {FD}; font-weight: 700; font-size: 44px; line-height: 50px; {NUM}">R$ 108,65</div></div>'
    f'<div role="group" aria-label="Forma de pagamento" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
    + mbtn(0, 'Dinheiro', 'caixa') + mbtn(1, 'Pix', 'confirmar') + mbtn(2, 'Débito', 'financeiro') + mbtn(3, 'Crédito', 'financeiro') + '</div>'
    f'<sc-if value="{H("din")}" hint-placeholder-val="{H("true")}"><div style="display: flex; flex-direction: column; gap: 10px"><b>Quanto o cliente entregou?</b>'
    f'<div role="group" aria-label="Valor recebido" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">' + CHIP('Exato', 'r0', 'y0') + CHIP('R$ 110,00', 'r1', 'y1') + CHIP('R$ 120,00', 'r2', 'y2') + CHIP('R$ 150,00', 'r3', 'y3') + '</div>'
    f'<div style="padding: 16px; border-radius: 12px; background: {OK_B}; color: {OK_T}; display: flex; justify-content: space-between; align-items: baseline; {NUM}"><b>Troco</b><span style="font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px">{H("troco")}</span></div></div></sc-if>'
    f'<sc-if value="{H("pix")}" hint-placeholder-val="{H("false")}"><div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
    f'<div role="img" aria-label="Espaço para o QR code do Pix" style="width: 160px; height: 160px; border-radius: 12px; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: {G2}">[QR CODE PIX]</div>'
    f'<div style="{SM}; text-align: center">Mostre o QR ao cliente. Confirme quando o Pix aparecer na conta.</div></div></sc-if>'
    f'<sc-if value="{H("cartao")}" hint-placeholder-val="{H("false")}"><div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; gap: 12px; align-items: flex-start">{icon("financeiro", 24, G2)}'
    f'<div><b>Passe na maquininha</b><div style="{SM}">Digite R$ 108,65 na maquininha e confirme aqui quando aprovar.</div></div></div></sc-if>'
    f'<a href="PDV-Combinado.dc.html" style="align-self: center; min-height: 44px; display: inline-flex; align-items: center; font-weight: 600; text-decoration: none">Dividir em duas formas</a></main>'
    + rodape(BIGA(H('btn'), 'PDV-Concluida.dc.html')))
logic_pag = ("renderVals() {\n" + JSFMT + "const st = this.state || {};\nconst m = st.m || 0;\nconst r = st.r === undefined ? 2 : st.r;\nconst R = [108.65, 110, 120, 150];\n"
             f"const on = '2px solid {G}', off = '1.5px solid {LN}';\n"
             "const B = ['Recebi ' + fmt(R[r]) + ' · concluir', 'Pix recebido · concluir', 'Cartão aprovado · concluir', 'Cartão aprovado · concluir'];\n"
             "const out = { din: m === 0, pix: m === 1, cartao: m >= 2, troco: fmt(R[r] - 108.65), btn: B[m] };\n"
             "[0, 1, 2, 3].forEach((k) => { out['ma' + k] = m === k; out['mb' + k] = m === k ? on : off; out['mt' + k] = () => this.setState({ m: k }); out['r' + k] = () => this.setState({ r: k }); });\n"
             + chip_vals('y0', 'r === 0') + chip_vals('y1', 'r === 1') + chip_vals('y2', 'r === 2') + chip_vals('y3', 'r === 3') + "return out;\n}")
gphone('PDV-Pagamento.dc.html', 'Bodeleve — PDV: pagamento', 900, pag, logic_pag)

# ---------- Pagamento combinado ----------
comb = (bar('Dividir pagamento', 'PDV-Pagamento.dc.html')
    + f'<main style="flex: 1 1 0; display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
    f'<div style="padding: 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}"><div style="font-size: 12px; line-height: 16px; color: {G2}">Total</div><div style="font-weight: 700; font-size: 20px; {NUM}">R$ 108,65</div></div>'
    f'<div style="padding: 12px; border-radius: 12px; background: {H("faltaBg")}"><div style="font-size: 12px; line-height: 16px; color: {G}">Falta receber</div><div style="font-weight: 700; font-size: 20px; color: {G}; {NUM}">{H("falta")}</div></div></div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px"><b>Já recebido</b><div style="padding: 0 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
    f'<sc-for list="{H("partes")}" as="pt" hint-placeholder-count="1"><div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 52px; border-bottom: 1px solid {LN}; {NUM}"><span>{{{{ pt.forma }}}}</span><b>{{{{ pt.valor }}}}</b></div></sc-for>'
    f'<sc-if value="{H("nenhuma")}" hint-placeholder-val="{H("false")}"><div style="min-height: 52px; display: flex; align-items: center; color: {G2}">Nada ainda</div></sc-if></div></section>'
    f'<sc-if value="{H("aberto")}" hint-placeholder-val="{H("true")}"><section style="padding: 16px; border-radius: 12px; background: {TS}; display: flex; flex-direction: column; gap: 10px"><b>Próxima parte</b>'
    f'<div role="group" aria-label="Forma" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">' + CHIP('Dinheiro', 'f0', 'z0') + CHIP('Pix', 'f1', 'z1') + CHIP('Débito', 'f2', 'z2') + CHIP('Crédito', 'f3', 'z3') + '</div>'
    f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="vp" style="font-size: 14px; line-height: 20px; font-weight: 600">Valor</label>'
    f'<input id="vp" type="text" inputmode="decimal" value="{H("vTxt")}" onChange="{H("onValor")}" style="height: 56px; padding: 0 16px; border-radius: 8px; border: 2px solid {G}; background: {W}; color: {G}; font: 600 22px {FB}; {NUM}; box-sizing: border-box; width: 100%"></div>'
    f'<button type="button" onClick="{H("addParte")}" style="height: 48px; border: 0; border-radius: 12px; background: {G}; color: {W}; font: 600 16px {FB}">Receber esta parte</button></section></sc-if></main>'
    + rodape(f'<sc-if value="{H("quitado")}" hint-placeholder-val="{H("false")}">' + BIGA('Concluir venda', 'PDV-Concluida.dc.html') + '</sc-if>'
             f'<sc-if value="{H("aberto")}" hint-placeholder-val="{H("true")}"><button type="button" disabled style="height: 56px; border: 0; border-radius: 12px; background: {LN}; color: {G2}; font: 600 16px {FB}; width: 100%; {NUM}">Falta {H("falta")}</button></sc-if>'
             + SEC('Recomeçar', H('reset'))))
logic_comb = ("renderVals() {\n" + JSFMT + "const st = this.state || {};\nconst F = ['Dinheiro', 'Pix', 'Débito', 'Crédito'];\nconst parts = st.parts || [{ f: 0, v: 50 }];\nconst f = st.f === undefined ? 1 : st.f;\n"
              "const pago = Math.round(parts.reduce((a, b) => a + b.v, 0) * 100) / 100;\nconst falta = Math.max(0, Math.round((108.65 - pago) * 100) / 100);\n"
              "const v = st.v === undefined ? falta : st.v;\n"
              f"const out = {{ partes: parts.map((p) => ({{ forma: F[p.f], valor: fmt(p.v) }})), nenhuma: parts.length === 0, falta: fmt(falta), faltaBg: falta > 0 ? '{AT_B}' : '{OK_B}', aberto: falta > 0, quitado: falta === 0,\n"
              "  vTxt: v.toFixed(2).replace('.', ','), onValor: (e) => { const n = parseFloat(String(e.target.value).replace(/\\./g, '').replace(',', '.')); this.setState({ v: isNaN(n) ? 0 : n }); },\n"
              "  addParte: () => { const val = Math.min(v, falta); if (val > 0) this.setState({ parts: parts.concat([{ f: f, v: val }]), v: undefined }); }, reset: () => this.setState({ parts: [], v: undefined }) };\n"
              "[0, 1, 2, 3].forEach((k) => { out['f' + k] = () => this.setState({ f: k }); });\n"
              + chip_vals('z0', 'f === 0') + chip_vals('z1', 'f === 1') + chip_vals('z2', 'f === 2') + chip_vals('z3', 'f === 3') + "return out;\n}")
gphone('PDV-Combinado.dc.html', 'Bodeleve — PDV: pagamento combinado', 940, comb, logic_comb)

# ---------- Venda concluída ----------
conc = (f'<main style="flex: 1 1 0; display: flex; flex-direction: column; gap: 16px; padding: 40px 16px 24px">'
    f'<div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px"><div aria-hidden="true" style="width: 72px; height: 72px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("confirmar", 36)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px">Venda concluída</h1><div style="color: {G2}; {NUM}">V-0213 · 15h31 · R$ 108,65</div></div>'
    f'<div style="padding: 20px; border-radius: 16px; background: {OK_B}; color: {OK_T}; display: flex; justify-content: space-between; align-items: baseline; {NUM}"><b>Troco a devolver</b><span style="font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px">R$ 11,35</span></div>'
    + card(li('Dinheiro recebido', 'R$ 120,00') + li('Saiu do estoque', '2 Queijo coalho, 0,5 kg Carne de sol, 1 Farinha'))
    + f'<sc-if value="{H("form")}" hint-placeholder-val="{H("true")}"><div style="display: flex; gap: 8px; align-items: flex-end"><div style="flex: 1 1 0; min-width: 0">' + campo('wz', 'Comprovante por WhatsApp (opcional)', '', '(00) 90000-0000', 'tel') + '</div>'
      f'<button type="button" onClick="{H("enviar")}" style="flex: none; height: 48px; padding: 0 16px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}">Enviar</button></div></sc-if>'
    + f'<sc-if value="{H("ok")}" hint-placeholder-val="{H("false")}"><div role="status" style="display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 12px; background: {G}; color: {C}; font-size: 14px">{icon("confirmar", 20)}<span>Comprovante enviado.</span></div></sc-if></main>'
    + rodape(BIGA('Nova venda', 'PDV-Vender.dc.html')))
gphone('PDV-Concluida.dc.html', 'Bodeleve — PDV: venda concluída', 820, conc, "renderVals() {\nconst ok = !!(this.state && this.state.ok);\nreturn { form: !ok, ok: ok, enviar: () => this.setState({ ok: true }) };\n}")

# ---------- Vendas (histórico) ----------
VEN = [('V-0212', '15h24', '3 itens', 'R$ 35,48', 1, 'PDV-Venda.dc.html'), ('V-0211', '15h10', '1 item', 'R$ 32,90', 2, None), ('V-0210', '14h58', '3 itens', 'R$ 80,30', 0, None),
       ('V-0209', '14h41', '5 itens', 'R$ 96,10', 2, None), ('V-0208', '14h20', '2 itens', 'R$ 27,40', 0, None), ('V-0207', '13h55', '4 itens', 'R$ 61,20', 1, None)]
FORMAS = ['Dinheiro', 'Pix', 'Cartão']
def vrow(i):
    n, h, it, v, f, href = VEN[i]
    inner = (f'<span style="flex: 1 1 0; min-width: 0"><b>{n} · {h}</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{it} · {FORMAS[f]}</span></span><span style="font-weight: 700; {NUM}">{v}</span>')
    st = f'display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; text-decoration: none; color: {G}; {NUM}'
    row = f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>' if href else f'<div style="{st}">{inner}</div>'
    return f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true")}">{row}</sc-if>'
vendas = (caixa_head()
    + f'<main style="flex: 1 1 0; display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div><div style="font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Vendas de hoje</div><div style="{SM}; {NUM}">26 vendas · R$ 892,00 no balcão</div></div>'
    f'<div role="group" aria-label="Filtrar por forma" style="display: flex; gap: 8px; flex-wrap: wrap">' + chips(['Todas', 'Dinheiro', 'Pix', 'Cartão']) + '</div>'
    + box(''.join(vrow(i) for i in range(len(VEN))), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Mostrando as 6 mais recentes. Vendas da loja online ficam em Pedidos, na gestão.</div></main>' + pnav(1))
logic_vendas = ("renderVals() {\nconst F = [" + ', '.join(str(v[4]) for v in VEN) + "];\nconst t = (this.state && this.state.t) || 0;\nconst out = {};\nF.forEach((f, i) => { out['v' + i] = t === 0 || f === t - 1; });\n" + chips_logic(4) + "return out;\n}")
gphone('PDV-Vendas.dc.html', 'Bodeleve — PDV: vendas', 860, vendas, logic_vendas)

# ---------- Detalhe da venda (cancelamento) ----------
venda = (f'<div style="position: relative; flex: 1 1 0; display: flex; flex-direction: column; min-height: 0">' + bar('Venda V-0212', 'PDV-Vendas.dc.html')
    + f'<main style="flex: 1 1 0; display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; gap: 8px; align-items: center"><sc-if value="{H("ativa")}" hint-placeholder-val="{H("true")}">{tagc("Concluída", OK_T, OK_B)}</sc-if><sc-if value="{H("cancelada")}" hint-placeholder-val="{H("false")}">{tagc("Cancelada", ER_T, ER_B)}</sc-if>'
    f'<span style="{SM}">Hoje, 15h24 · Júlia</span></div>'
    + box(''.join(f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}"><span>{a}<span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{b}</span></span><span>{c}</span></div>'
                  for a, b, c in (('1 × Farinha de mandioca', 'lote FM-0921', 'R$ 12,90'), ('1 × Tapioca granulada', 'lote TG-1030', 'R$ 9,90'), ('0,750 kg × Feijão de corda', 'R$ 16,90/kg', 'R$ 12,68')))
          + f'<div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: 700; {NUM}"><span>Total</span><span>R$ 35,48</span></div>', 'padding-top: 0; padding-bottom: 0')
    + card(li('Pagamento', 'Pix · confirmado 15h24'))
    + f'<sc-if value="{H("cancelada")}" hint-placeholder-val="{H("false")}"><div role="status" style="padding: 12px 14px; border-radius: 12px; background: {ER_B}; color: {ER_T}; font-size: 14px; line-height: 20px; font-weight: 500">Cancelada às 15h40 por Ana (gestora). Os itens voltaram ao estoque. Devolva R$ 35,48 por Pix ao cliente.</div></sc-if></main>'
    + rodape(f'<sc-if value="{H("ativa")}" hint-placeholder-val="{H("true")}"><button type="button" onClick="{H("abrir")}" style="height: 48px; border: 1.5px solid {ER_T}; border-radius: 12px; background: {W}; color: {ER_T}; font: 600 16px {FB}; width: 100%">Cancelar venda</button></sc-if>'
             + SECA('Voltar às vendas', 'PDV-Vendas.dc.html'))
    + f'<sc-if value="{H("modal")}" hint-placeholder-val="{H("false")}"><div style="position: absolute; inset: 0; background: rgba(41,38,33,0.45); display: flex; align-items: center; padding: 24px">'
      f'<div role="alertdialog" aria-modal="true" aria-labelledby="mt" style="width: 100%; background: {W}; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 12px">'
      f'<div id="mt" style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">Cancelar a venda V-0212?</div><div style="{SM}">Os itens voltam ao estoque. Cancelamento precisa da senha de um gestor.</div>'
      + campo('pin', 'Senha do gestor', '', '••••', 'password', ' inputmode="numeric" autocomplete="off"')
      + f'<button type="button" onClick="{H("confirmar")}" style="height: 48px; border: 0; border-radius: 12px; background: {ER_T}; color: {W}; font: 600 16px {FB}">Cancelar venda</button>' + SEC('Voltar', H('fechar')) + '</div></div></sc-if></div>')
logic_venda = ("renderVals() {\nconst st = this.state || {};\nconst c = !!st.c;\nreturn { ativa: !c, cancelada: c, modal: !!st.m, abrir: () => this.setState({ m: true }), fechar: () => this.setState({ m: false }), confirmar: () => this.setState({ m: false, c: true }) };\n}")
gphone('PDV-Venda.dc.html', 'Bodeleve — PDV: detalhe da venda', 840, venda, logic_venda)

# ---------- Caixa (turno, sangria e fechamento) ----------
sang_sheet = sheet_wrap('sOpen',
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 28px">Movimentar dinheiro</div>'
    + f'<div role="group" aria-label="Tipo" style="display: flex; gap: 8px">' + CHIP('Retirar (sangria)', 'tp0', 'w0') + CHIP('Colocar (suprimento)', 'tp1', 'w1') + '</div>'
    + f'<div role="group" aria-label="Valor" style="display: flex; gap: 8px">' + CHIP('R$ 50', 'vl0', 'u0') + CHIP('R$ 100', 'vl1', 'u1') + CHIP('R$ 200', 'vl2', 'u2') + '</div>'
    + sel('smot', 'Motivo', ['Levar ao banco', 'Troco para entregador', 'Pagamento em dinheiro', 'Reforço de troco'])
    + BIG('Registrar', H('regMov')) + SEC('Cancelar', H('sFechar')), 'Sangria ou suprimento')
caixa = (f'<div style="position: relative; flex: 1 1 0; display: flex; flex-direction: column; min-height: 0">' + caixa_head()
    + f'<sc-if value="{H("aberto")}" hint-placeholder-val="{H("true")}"><main style="flex: 1 1 0; display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Caixa de hoje</div>'
    + card(f'<b>Vendas no balcão · 26</b>' + li('Dinheiro', 'R$ 312,00') + li('Pix', 'R$ 197,60') + li('Cartão', 'R$ 382,40')
           + f'<div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid {LN}; font-weight: 700; {NUM}"><span>Total</span><span>R$ 892,00</span></div>')
    + f'<section style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}"><b>Dinheiro na gaveta</b>'
    + li('Abertura (troco)', 'R$ 150,00') + li('Vendas em dinheiro', '+ R$ 312,00')
    + f'<sc-for list="{H("movs")}" as="mv" hint-placeholder-count="1"><div style="display: flex; justify-content: space-between; gap: 12px; color: {G2}"><span>{{{{ mv.t }}}}</span><span>{{{{ mv.v }}}}</span></div></sc-for>'
    + f'<div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid {LN}; font-weight: 700"><span>Esperado</span><span>{H("esperado")}</span></div></section>'
    + SEC('Sangria ou suprimento', H('sAbrir'))
    + f'<section style="padding: 16px; border-radius: 12px; background: {TS}; display: flex; flex-direction: column; gap: 10px"><b>Fechar caixa</b>'
    f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px"><span><b>Contado na gaveta</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">Conte as notas e moedas</span></span>'
    + stepper('Valor contado, de 1 em 1 real', H('cMenos'), H('cMais'), H('contado')) + '</div>'
    + f'<div style="display: flex; justify-content: space-between; font-weight: 700; color: {H("difCor")}; {NUM}"><span>Diferença</span><span>{H("dif")}</span></div>'
    + BIG('Fechar caixa', H('fecharCx')) + '</section></main></sc-if>'
    f'<sc-if value="{H("fechado")}" hint-placeholder-val="{H("false")}"><main style="flex: 1 1 0; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 48px 24px">'
    f'<div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("caixa", 32)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Caixa fechado</h1><div style="color: {G2}; {NUM}">{H("resumo")}</div>'
    + f'<div style="width: 100%; display: flex; flex-direction: column; gap: 8px; margin-top: 12px">' + BIGA('Abrir novo caixa', 'PDV-Abertura.dc.html') + SEC('Reabrir (corrigir)', H('reabrir')) + '</div></main></sc-if>'
    + pnav(2) + sang_sheet + '</div>')
logic_caixa = ("renderVals() {\n" + JSFMT + "const st = this.state || {};\nconst movs = st.movs || [{ s: -1, v: 50, m: 'Troco para entregador' }];\nconst tp = st.tp || 0;\nconst vl = st.vl === undefined ? 1 : st.vl;\nconst VL = [50, 100, 200];\n"
               "const esp = 150 + 312 + movs.reduce((a, b) => a + b.s * b.v, 0);\nconst cont = st.cont === undefined ? esp - 5 : st.cont;\nconst dif = cont - esp;\n"
               f"const out = {{ aberto: !st.fechado, fechado: !!st.fechado, sOpen: !!st.sOpen, esperado: fmt(esp), contado: fmt(cont), dif: (dif > 0 ? '+ ' : dif < 0 ? '− ' : '') + fmt(Math.abs(dif)), difCor: dif === 0 ? '{OK_T}' : '{ER_T}',\n"
               "  movs: movs.map((m) => ({ t: (m.s < 0 ? 'Sangria · ' : 'Suprimento · ') + m.m, v: (m.s < 0 ? '− ' : '+ ') + fmt(m.v) })),\n"
               "  resumo: 'Esperado ' + fmt(esp) + ' · contado ' + fmt(cont) + ' · diferença ' + (dif === 0 ? 'zero' : (dif > 0 ? 'sobra de ' : 'falta de ') + fmt(Math.abs(dif))) + '. O gestor vê o fechamento no financeiro.',\n"
               "  cMenos: () => this.setState({ cont: cont - 1 }), cMais: () => this.setState({ cont: cont + 1 }), fecharCx: () => this.setState({ fechado: true }), reabrir: () => this.setState({ fechado: false }),\n"
               "  sAbrir: () => this.setState({ sOpen: true }), sFechar: () => this.setState({ sOpen: false }), tp0: () => this.setState({ tp: 0 }), tp1: () => this.setState({ tp: 1 }),\n"
               "  vl0: () => this.setState({ vl: 0 }), vl1: () => this.setState({ vl: 1 }), vl2: () => this.setState({ vl: 2 }),\n"
               "  regMov: () => this.setState({ movs: movs.concat([{ s: tp === 0 ? -1 : 1, v: VL[vl], m: tp === 0 ? 'Levar ao banco' : 'Reforço de troco' }]), sOpen: false, cont: undefined }) };\n"
               + chip_vals('w0', 'tp === 0') + chip_vals('w1', 'tp === 1') + chip_vals('u0', 'vl === 0') + chip_vals('u1', 'vl === 1') + chip_vals('u2', 'vl === 2') + "return out;\n}")
gphone('PDV-Caixa.dc.html', 'Bodeleve — PDV: caixa', 1160, caixa, logic_caixa)
