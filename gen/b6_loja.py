from common import *
import os

NUM = 'font-variant-numeric: tabular-nums'
def H(n): return '{{ ' + n + ' }}'

def phone(fname, title, h, body, logic):
    html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<title>' + title + '</title>\n<script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n'
            '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">\n'
            '<style>\nbody{margin:0}\na{color:#A9482C}a:hover{color:#8A3920}\n</style>\n</helmet>\n'
            f'<div style="width: 390px; height: {h}px; box-sizing: border-box; display: flex; flex-direction: column; background: {C}; color: {G}; font-family: {FB}; font-size: 16px; line-height: 24px">\n'
            + body + '\n</div>\n</x-dc>\n'
            '<script type="text/x-dc" data-dc-script data-props=\'{"$preview":{"width":390,"height":' + str(h) + '}}\'>\n'
            'class Component extends DCLogic {\n' + logic + '\n}\n</script>\n</body>\n</html>\n')
    open(os.path.join(OUT, fname), 'w').write(html)
    print(fname, len(html))

FMT = "const fmt = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');"
foto = lambda hh, r=10: f'<div role="img" aria-label="Espaço para foto do produto" style="height: {hh}px; border-radius: {r}px; background: {W}; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 12px; line-height: 16px; font-weight: 600; color: {G2}">[FOTO DO PRODUTO]</div>'
ibtn = lambda label, ic, on, fg=G, bg='transparent', bd='0', s=44: f'<button type="button" aria-label="{label}" onClick="{on}" style="flex: none; width: {s}px; height: {s}px; border-radius: 12px; border: {bd}; background: {bg}; color: {fg}; display: inline-flex; align-items: center; justify-content: center">{icon(ic, 20)}</button>'
def cta(t, href, extra=''):
    return f'<a href="{href}" style="height: 56px; padding: 0 20px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; font-size: 16px; {extra}">{t}</a>'
def topbar(titulo, back):
    return (f'<header style="display: flex; align-items: center; gap: 4px; height: 56px; padding: 0 6px; flex: none">'
            f'<a href="{back}" aria-label="Voltar" style="width: 44px; height: 44px; border-radius: 12px; color: {G}; display: inline-flex; align-items: center; justify-content: center">{icon("voltar")}</a>'
            f'<div style="flex: 1 1 0; font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">{titulo}</div>'
            f'<a href="Loja-Sacola.dc.html" aria-label="Abrir sacola" style="width: 44px; height: 44px; border-radius: 12px; color: {G}; display: inline-flex; align-items: center; justify-content: center">{icon("sacola")}</a></header>')

# ---------------- Início ----------------
PRODS = [('Queijo coalho', '500 g', 'R$ 32,90', 'casa'), ('Carne de sol', '500 g', 'R$ 34,90', ''), ('Farinha de mandioca', '1 kg', 'R$ 12,90', ''), ('Tapioca granulada', '500 g', 'R$ 9,90', ''),
         ('Queijo manteiga', '500 g', 'R$ 36,90', 'casa'), ('Doce de leite', '400 g', 'R$ 18,90', 'casa'), ('Rapadura', '400 g', 'R$ 14,50', 'marca'), ('Manteiga de garrafa', '200 ml', 'R$ 28,00', 'marca')]
def card(i):
    n, u, p, o = PRODS[i]
    s = seal('Feito na casa', V) if o == 'casa' else seal('Marca Bodeleve', T) if o == 'marca' else ''
    return (f'<article style="padding: 10px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; min-width: 0">'
            f'<a href="Loja-Produto.dc.html" style="display: flex; flex-direction: column; gap: 8px; text-decoration: none; color: {G}">'
            f'<div role="img" aria-label="Espaço para foto do produto" style="height: 110px; border-radius: 10px; background: {C}; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 11px; line-height: 16px; font-weight: 600; color: {G2}">[FOTO DO PRODUTO]</div>'
            f'<div style="min-height: 24px">{s}</div><div><div style="font-weight: 600; line-height: 22px">{n}</div><div style="font-size: 13px; line-height: 18px; color: {G2}">{u}</div></div></a>'
            f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><div style="font-weight: 600; font-size: 17px; {NUM}">{p}</div>'
            + ibtn('Adicionar ' + n + ' à sacola', 'adicionar', H('add' + str(i)), W, T) + '</div></article>')
def secao(idn, titulo, sub, idx):
    return (f'<section id="{idn}" style="display: flex; flex-direction: column; gap: 12px"><div><h2 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 28px">{titulo}</h2>'
            f'<div style="{SM}">{sub}</div></div><div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">' + ''.join(card(i) for i in idx) + '</div></section>')
chipa = lambda t, href: f'<a href="{href}" style="flex: none; height: 40px; padding: 0 16px; border-radius: 999px; border: 1.5px solid {G}; background: {W}; color: {G}; text-decoration: none; display: inline-flex; align-items: center; font-weight: 600; font-size: 14px">{t}</a>'
def navitem(ic, t, on=False):
    if on:
        return f'<a href="#topo" aria-current="page" style="flex: 1 1 0; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-decoration: none; color: {T}; font-size: 12px; line-height: 16px; font-weight: 700">{icon(ic)}<span>{t}</span></a>'
    return f'<span style="flex: 1 1 0; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: {G2}; font-size: 12px; line-height: 16px; font-weight: 500">{icon(ic)}<span>{t}</span></span>'

NAVS = [('inicio', 'Início', 'Loja-Inicio.dc.html'), ('buscar', 'Buscar', 'Loja-Buscar.dc.html'), ('pedidos', 'Pedidos', 'Loja-Pedidos.dc.html'), ('perfil', 'Perfil', 'Loja-Perfil.dc.html')]
def nav(active):
    cells = ''
    for i, (ic, t, href) in enumerate(NAVS):
        on = i == active
        cur = 'aria-current="page" ' if on else ''
        cells += (f'<a href="{href}" {cur}style="flex: 1 1 0; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-decoration: none; '
                  f'color: {T if on else G2}; font-size: 12px; line-height: 16px; font-weight: {700 if on else 500}">{icon(ic)}<span>{t}</span></a>')
    return f'<nav aria-label="Navegação principal" style="flex: none; display: flex; background: {W}; border-top: 1px solid {LN}">{cells}</nav>'
linkq = lambda t, href, cor=T: f'<a href="{href}" style="align-self: flex-start; min-height: 44px; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; text-decoration: none; color: {cor}">{t}{icon("avancar", 18)}</a>'

inicio = (
    f'<header id="topo" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 8px; flex: none"><div style="font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px; letter-spacing: -0.01em">Bodeleve</div>'
    f'<a href="Loja-Sacola.dc.html" aria-label="Abrir sacola" style="position: relative; width: 44px; height: 44px; border-radius: 12px; background: {W}; border: 1px solid {LN}; color: {G}; display: inline-flex; align-items: center; justify-content: center; text-decoration: none">{icon("sacola")}'
    f'<sc-if value="{H("tem")}" hint-placeholder-val="{H("false")}"><span style="position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 5px; box-sizing: border-box; border-radius: 999px; background: {T}; color: {W}; font-size: 12px; line-height: 20px; font-weight: 700; text-align: center">{H("cont")}</span></sc-if></a></header>'
    f'<main style="display: flex; flex-direction: column; gap: 24px; padding: 8px 16px 24px">'
    f'<div style="display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 16px; border-radius: 999px; background: {W}; border: 1.5px solid {LN}; color: {G2}">{icon("buscar", 20)}'
    f'<label for="busca" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)">Buscar produto</label><input id="busca" type="search" placeholder="Buscar na Bodeleve" style="flex: 1 1 0; min-width: 0; border: 0; background: transparent; font: 400 16px {FB}; color: {G}; outline: none"></div>'
    f'<div style="padding: 24px 20px; border-radius: 20px; background: {T}; color: {W}; display: flex; flex-direction: column; gap: 12px"><div style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase">Casa do Norte</div>'
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 32px; letter-spacing: -0.01em">Sabores do Norte, feitos e escolhidos pela casa.</div>'
    f'<a href="#casa" style="align-self: flex-start; height: 44px; padding: 0 18px; border-radius: 12px; background: {W}; color: {TP}; text-decoration: none; display: inline-flex; align-items: center; font-weight: 600; font-size: 15px">Ver o que é feito aqui</a></div>'
    f'<nav aria-label="Atalhos" style="display: flex; gap: 8px; flex-wrap: wrap">{chipa("Mais pedidos", "#pedidos")}{chipa("Feitos na casa", "#casa")}{chipa("Linha Bodeleve", "#marca")}</nav>'
    + secao('pedidos', 'Mais pedidos', 'O que mais sai no balcão.', [0, 1, 2, 3])
    + secao('casa', 'Feitos na casa', 'Produzidos aqui, em pequenos lotes.', [4, 5])
    + secao('marca', 'Linha Bodeleve', 'Produtos com a marca da casa.', [6, 7]) + linkq('Conhecer a Linha Bodeleve', 'Loja-Linha.dc.html')
    + f'<section style="padding: 20px; border-radius: 20px; background: {V}; color: {W}; display: flex; flex-direction: column; gap: 8px"><h2 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 28px">Sobre a Bodeleve</h2>'
      f'<div style="font-size: 15px; line-height: 22px">[TEXTO DA CASA: de onde vem, há quanto tempo existe, o que produz]</div>' + linkq('Conhecer a casa', 'Loja-Sobre.dc.html', W) + '</section>'
    '</main>'
    f'<div style="margin-top: auto; flex: none; display: flex; flex-direction: column">'
    f'<sc-if value="{H("tem")}" hint-placeholder-val="{H("false")}"><a href="Loja-Sacola.dc.html" style="margin: 0 12px 12px; height: 56px; padding: 0 16px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: flex; align-items: center; gap: 12px; font-weight: 600">{icon("sacola")}<span style="flex: 1 1 0">Ver sacola · {H("itens")}</span><span style="{NUM}">{H("total")}</span></a></sc-if>'
    + nav(0) + '</div>')
logic_inicio = ('renderVals() {\n' + FMT + '\nconst P = [32.9, 34.9, 12.9, 9.9, 36.9, 18.9, 14.5, 28];\nconst q = (this.state && this.state.q) || [0, 0, 0, 0, 0, 0, 0, 0];\n'
                'const n = q.reduce((a, b) => a + b, 0);\nconst total = q.reduce((a, b, i) => a + b * P[i], 0);\n'
                'const add = (i) => () => { const c = q.slice(); c[i] = c[i] + 1; this.setState({ q: c }); };\n'
                "return { tem: n > 0, cont: n, itens: n + (n === 1 ? ' item' : ' itens'), total: fmt(total), "
                + ', '.join(f'add{i}: add({i})' for i in range(8)) + ' };\n}')
phone('Loja-Inicio.dc.html', 'Bodeleve — loja: início', 2360, inicio, logic_inicio)

# ---------------- Produto ----------------
def info(t, v):
    return f'<div style="display: flex; justify-content: space-between; gap: 16px; padding: 14px 0; border-top: 1px solid {LN}"><span style="color: {G2}">{t}</span><span style="font-weight: 500; text-align: right">{v}</span></div>'
produto = (topbar('', 'Main-Loja') .replace('Main-Loja', 'Loja-Inicio.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 0 16px 24px"><div>{foto(300, 20)}</div>'
    f'<div style="display: flex; flex-direction: column; gap: 8px"><div>{seal("Feito na casa", V)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px">Queijo coalho</h1>'
    f'<div style="{SM}">Peça de 500 g</div><div style="font-weight: 600; font-size: 22px; line-height: 28px; {NUM}">R$ 32,90</div></div>'
    f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}"><span id="ql" style="font-weight: 600">Quantidade</span>'
    f'<div role="group" aria-labelledby="ql" style="display: inline-flex; align-items: center; gap: 4px">' + ibtn('Diminuir', 'remover', H('menos'), G, C, f'1px solid {LN}')
    + f'<div aria-live="polite" style="min-width: 36px; text-align: center; font-weight: 600; font-size: 18px; {NUM}">{H("qtd")}</div>' + ibtn('Aumentar', 'adicionar', H('mais'), W, T) + '</div></div>'
    f'<p style="margin: 0; color: {G2}">[DESCRIÇÃO DO PRODUTO: como é feito, sabor, sugestão de uso]</p>'
    f'<div style="border-bottom: 1px solid {LN}">' + info('Origem', 'Feito na casa') + info('Conservação', '[COMO CONSERVAR]') + info('Validade', '[PRAZO DE VALIDADE]') + info('Ingredientes', '[INGREDIENTES]') + '</div></main>'
    f'<div style="margin-top: auto; flex: none; padding: 12px 16px 16px; background: {W}; border-top: 1px solid {LN}">'
    + cta(f'<span style="flex: 1 1 0">Adicionar à sacola</span><span style="{NUM}">{H("total")}</span>', 'Loja-Sacola.dc.html', 'justify-content: space-between') + '</div>')
logic_produto = ('renderVals() {\n' + FMT + '\nconst q = (this.state && this.state.q) || 1;\n'
                 'return { qtd: q, total: fmt(q * 32.9), menos: () => this.setState({ q: Math.max(1, q - 1) }), mais: () => this.setState({ q: q + 1 }) };\n}')
phone('Loja-Produto.dc.html', 'Bodeleve — loja: produto', 1080, produto, logic_produto)

# ---------------- Sacola ----------------
ITENS = [('Queijo coalho', '500 g · R$ 32,90'), ('Farinha de mandioca', '1 kg · R$ 12,90'), ('Rapadura', '400 g · R$ 14,50')]
def item(i):
    n, d = ITENS[i]
    return (f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true")}"><div style="display: flex; gap: 12px; align-items: center; padding: 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
            f'<div style="flex: none; width: 56px"><div role="img" aria-label="Espaço para foto do produto" style="height: 56px; border-radius: 10px; background: {C}; border: 1px dashed {G2}"></div></div>'
            f'<div style="flex: 1 1 0; min-width: 0"><div style="font-weight: 600; line-height: 22px">{n}</div><div style="font-size: 13px; line-height: 18px; color: {G2}; {NUM}">{d}</div>'
            f'<div style="font-weight: 600; {NUM}">{H("s" + str(i))}</div></div>'
            f'<div role="group" aria-label="Quantidade de {n}" style="display: inline-flex; align-items: center; gap: 2px">' + ibtn('Diminuir', 'remover', H('m' + str(i)), G, C, f'1px solid {LN}', 40)
            + f'<div style="min-width: 28px; text-align: center; font-weight: 600; {NUM}">{H("q" + str(i))}</div>' + ibtn('Aumentar', 'adicionar', H('p' + str(i)), W, T, '0', 40) + '</div></div></sc-if>')
def segm(ent):
    on = f'height: 40px; border: 0; border-radius: 8px; background: {W}; color: {G}; font: 600 14px {FB}; box-shadow: 0 1px 2px rgba(41,38,33,0.12)'
    off = f'height: 40px; border: 0; border-radius: 8px; background: transparent; color: {G2}; font: 600 14px {FB}'
    return (f'<div role="group" aria-label="Como receber" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 4px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
            f'<button type="button" aria-pressed="{"true" if ent else "false"}" onClick="{H("setEntrega")}" style="{on if ent else off}">Entrega</button>'
            f'<button type="button" aria-pressed="{"false" if ent else "true"}" onClick="{H("setRetirada")}" style="{off if ent else on}">Retirar na loja</button></div>')
sacola = (topbar('Sacola', 'Loja-Inicio.dc.html')
    + f'<sc-if value="{H("cheia")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 4px 16px 24px">'
    + f'<div style="display: flex; flex-direction: column; gap: 10px">' + ''.join(item(i) for i in range(3)) + '</div>'
    + f'<a href="Loja-Inicio.dc.html" style="align-self: flex-start; min-height: 44px; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; text-decoration: none">{icon("adicionar", 18)}Adicionar mais produtos</a>'
    + f'<div style="display: flex; flex-direction: column; gap: 8px"><div style="font-weight: 600">Como você quer receber?</div>'
    + f'<sc-if value="{H("ent")}" hint-placeholder-val="{H("true")}">{segm(True)}</sc-if><sc-if value="{H("ret")}" hint-placeholder-val="{H("false")}">{segm(False)}</sc-if></div>'
    + f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}">'
      f'<div style="display: flex; justify-content: space-between; color: {G2}"><span>Subtotal</span><span>{H("subtotal")}</span></div>'
      f'<div style="display: flex; justify-content: space-between; color: {G2}"><span>{H("freteRotulo")}</span><span>{H("frete")}</span></div>'
      f'<div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid {LN}; font-weight: 600; font-size: 18px"><span>Total</span><span>{H("total")}</span></div></div>'
    + f'<div style="{SM}">Você não precisa criar conta para comprar.</div></main>'
    + f'<div style="margin-top: auto; flex: none; padding: 12px 16px 16px; background: {W}; border-top: 1px solid {LN}">'
    + cta(f'<span style="flex: 1 1 0">Continuar</span><span style="{NUM}">{H("total")}</span>', 'Loja-Identificacao.dc.html', 'justify-content: space-between') + '</div></sc-if>'
    + f'<sc-if value="{H("vazia")}" hint-placeholder-val="{H("false")}"><main style="flex: 1 1 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 12px; padding: 24px">'
      f'<div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {TS}; color: {TP}; display: flex; align-items: center; justify-content: center">{icon("sacola", 30)}</div>'
      f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 28px">Sua sacola está vazia</h1><div style="{SM}; max-width: 260px">Os produtos que você adicionar aparecem aqui.</div>'
    + cta('Ver produtos', 'Loja-Inicio.dc.html', 'height: 48px') + '</main></sc-if>')
logic_sacola = ('renderVals() {\n' + FMT + '\nconst P = [32.9, 12.9, 14.5];\nconst st = this.state || {};\nconst q = st.q || [1, 2, 1];\nconst ent = st.modo !== \'retirada\';\n'
                'const sub = q.reduce((a, b, i) => a + b * P[i], 0);\nconst frete = ent ? 8 : 0;\nconst n = q.reduce((a, b) => a + b, 0);\n'
                'const chg = (i, d) => () => { const c = q.slice(); c[i] = Math.max(0, c[i] + d); this.setState({ q: c }); };\n'
                "return { cheia: n > 0, vazia: n === 0, ent: ent, ret: !ent, subtotal: fmt(sub), freteRotulo: ent ? 'Entrega (estimada)' : 'Retirada na loja', frete: ent ? fmt(frete) : 'Grátis', total: fmt(sub + frete), "
                "setEntrega: () => this.setState({ modo: 'entrega' }), setRetirada: () => this.setState({ modo: 'retirada' }), "
                + ', '.join(f'v{i}: q[{i}] > 0, q{i}: q[{i}], s{i}: fmt(q[{i}] * P[{i}]), m{i}: chg({i}, -1), p{i}: chg({i}, 1)' for i in range(3)) + ' };\n}')
phone('Loja-Sacola.dc.html', 'Bodeleve — loja: sacola', 960, sacola, logic_sacola)

# ---------------- Pedido confirmado ----------------
def passo(t, sub, estado):
    dot = {'ok': f'background: {V}; color: {W}; border: 2px solid {V}', 'depois': f'background: {W}; color: {G2}; border: 2px solid {LN}'}[estado]
    ic = icon('confirmar', 14) if estado == 'ok' else ''
    return (f'<li style="display: flex; gap: 12px; align-items: flex-start"><span aria-hidden="true" style="flex: none; width: 24px; height: 24px; border-radius: 999px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; {dot}">{ic}</span>'
            f'<div><div style="font-weight: 600; color: {G if estado == "ok" else G2}">{t}</div><div style="font-size: 13px; line-height: 18px; color: {G2}">{sub}</div></div></li>')
conf = (f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 40px 16px 24px">'
    f'<div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px"><div aria-hidden="true" style="width: 72px; height: 72px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("confirmar", 36)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px">Pedido confirmado</h1><div style="color: {G2}; {NUM}">Pedido 1042 · previsão de entrega às 15h40</div></div>'
    f'<div style="padding: 16px; border-radius: 12px; background: {TS}; display: flex; align-items: center; justify-content: space-between; gap: 16px"><div><div style="font-weight: 600; color: {TP}">Código de entrega</div>'
    f'<div style="font-size: 13px; line-height: 18px; color: {G}">Informe ao entregador ao receber.</div></div><div style="font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px; letter-spacing: 0.08em; color: {TP}; {NUM}">4821</div></div>'
    f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}"><ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 14px">'
    + passo('Pedido recebido', '14h52', 'ok') + passo('Em preparo', 'A casa está separando seus itens', 'depois') + passo('Saiu para entrega', '', 'depois') + passo('Entregue', '', 'depois') + '</ol></div>'
    f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}"><div style="font-weight: 600">Resumo</div>'
    f'<div style="display: flex; justify-content: space-between; color: {G2}"><span>4 itens</span><span>R$ 73,20</span></div><div style="display: flex; justify-content: space-between; color: {G2}"><span>Entrega</span><span>R$ 8,00</span></div>'
    f'<div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid {LN}; font-weight: 600"><span>Total</span><span>R$ 81,20</span></div></div></main>'
    f'<div style="margin-top: auto; flex: none; padding: 12px 16px 16px; display: flex; flex-direction: column; gap: 8px">' + cta('Acompanhar pedido', 'Loja-Acompanhamento.dc.html')
    + f'<a href="Loja-Inicio.dc.html" style="height: 48px; border-radius: 12px; border: 1.5px solid {G}; color: {G}; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 600">Voltar ao início</a></div>')
phone('Loja-Confirmado.dc.html', 'Bodeleve — loja: pedido confirmado', 1000, conf, 'renderVals() {\nreturn {};\n}')
