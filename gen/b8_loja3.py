from b7_checkout import *   # regenera lotes 1 e 2 com as abas ativas e traz os auxiliares
from b6_loja import nav, linkq

cta2 = lambda t, href: f'<a href="{href}" style="height: 48px; padding: 0 20px; border-radius: 12px; border: 1.5px solid {G}; color: {G}; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 600">{t}</a>'
def rowlink(ic, t, sub, href, last=False):
    bd = '' if last else f'border-bottom: 1px solid {LN}; '
    s = f'<span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{sub}</span>' if sub else ''
    return (f'<a href="{href}" style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 0; {bd}text-decoration: none; color: {G}">{icon(ic, 22, G2)}'
            f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{t}</span>{s}</span>{icon("avancar", 18, G2)}</a>')
box = lambda inner, extra='': f'<div style="padding: 4px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; {extra}">{inner}</div>'
def sacbar():
    return (f'<sc-if value="{H("tem")}" hint-placeholder-val="{H("false")}"><a href="Loja-Sacola.dc.html" style="margin: 0 12px 12px; height: 56px; padding: 0 16px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: flex; align-items: center; gap: 12px; font-weight: 600">'
            f'{icon("sacola")}<span style="flex: 1 1 0">Ver sacola · {H("itens")}</span><span style="{NUM}">{H("total")}</span></a></sc-if>')
def pcard(n, u, p, o, add):
    s = seal('Feito na casa', V) if o == 'casa' else seal('Marca Bodeleve', T) if o == 'marca' else ''
    return (f'<article style="padding: 10px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; min-width: 0">'
            f'<a href="Loja-Produto.dc.html" style="display: flex; flex-direction: column; gap: 8px; text-decoration: none; color: {G}">'
            f'<div role="img" aria-label="Espaço para foto do produto" style="height: 110px; border-radius: 10px; background: {C}; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 11px; line-height: 16px; font-weight: 600; color: {G2}">[FOTO DO PRODUTO]</div>'
            f'<div style="min-height: 24px">{s}</div><div><div style="font-weight: 600; line-height: 22px">{n}</div><div style="font-size: 13px; line-height: 18px; color: {G2}">{u}</div></div></a>'
            f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><div style="font-weight: 600; font-size: 17px; {NUM}">{p}</div>'
            + ibtn('Adicionar ' + n + ' à sacola', 'adicionar', H(add), W, T) + '</div></article>')
def passo(t, sub, estado):
    dot = {'ok': f'background: {V}; color: {W}; border: 2px solid {V}', 'agora': f'background: {W}; color: {T}; border: 2px solid {T}', 'depois': f'background: {W}; color: {G2}; border: 2px solid {LN}'}[estado]
    ic = icon('confirmar', 14) if estado == 'ok' else ''
    return (f'<li style="display: flex; gap: 12px; align-items: flex-start"><span aria-hidden="true" style="flex: none; width: 24px; height: 24px; border-radius: 999px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; {dot}">{ic}</span>'
            f'<div><div style="font-weight: {700 if estado == "agora" else 600}; color: {G2 if estado == "depois" else G}">{t}</div><div style="font-size: 13px; line-height: 18px; color: {G2}">{sub}</div></div></li>')
titulo = lambda t: f'<header style="padding: 16px 16px 8px; flex: none"><h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px; letter-spacing: -0.01em">{t}</h1></header>'
h2 = lambda t: f'<h2 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">{t}</h2>'
VAZIO = 'renderVals() {\nreturn {};\n}'

# ---------- Categoria ----------
CAT = [('Queijo coalho', '500 g', 'R$ 32,90', 'casa'), ('Queijo manteiga', '500 g', 'R$ 36,90', 'casa'), ('Manteiga de garrafa', '200 ml', 'R$ 28,00', 'marca'),
       ('Doce de leite', '400 g', 'R$ 18,90', 'casa'), ('Requeijão', '250 g', 'R$ 11,90', ''), ('Nata', '200 g', 'R$ 9,50', '')]
def fchip(i, t):
    return (f'<button type="button" aria-pressed="{H("a" + str(i))}" onClick="{H("f" + str(i))}" style="flex: none; height: 40px; padding: 0 16px; border-radius: 999px; border: 1.5px solid {G}; '
            f'background: {H("b" + str(i))}; color: {H("c" + str(i))}; font: 600 14px {FB}">{t}</button>')
cat = (topbar('Queijos e laticínios', 'Loja-Buscar.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 4px 16px 24px"><div role="group" aria-label="Filtrar por origem" style="display: flex; gap: 8px; flex-wrap: wrap">{fchip(0, "Todos")}{fchip(1, "Feitos na casa")}{fchip(2, "Marca Bodeleve")}</div>'
    + f'<div aria-live="polite" style="{SM}">{H("conta")}</div><div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">'
    + ''.join(f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true")}">{pcard(*CAT[i], "add" + str(i))}</sc-if>' for i in range(6)) + '</div></main>'
    + f'<div style="margin-top: auto; flex: none; display: flex; flex-direction: column">{sacbar()}{nav(1)}</div>')
logic_cat = ('renderVals() {\n' + FMT + "\nconst P = [32.9, 36.9, 28, 18.9, 11.9, 9.5];\nconst O = ['casa', 'casa', 'marca', 'casa', '', ''];\nconst st = this.state || {};\nconst f = st.f || 'todos';\nconst q = st.q || [0, 0, 0, 0, 0, 0];\n"
             "const vis = O.map((o) => f === 'todos' || o === f);\nconst nv = vis.filter(Boolean).length;\nconst n = q.reduce((a, b) => a + b, 0);\nconst total = q.reduce((a, b, i) => a + b * P[i], 0);\n"
             "const add = (i) => () => { const c = q.slice(); c[i] = c[i] + 1; this.setState({ q: c }); };\nconst F = ['todos', 'casa', 'marca'];\nconst out = { conta: nv + (nv === 1 ? ' produto' : ' produtos'), tem: n > 0, itens: n + (n === 1 ? ' item' : ' itens'), total: fmt(total) };\n"
             "F.forEach((k, i) => { out['a' + i] = f === k; out['b' + i] = f === k ? '" + G + "' : '" + W + "'; out['c' + i] = f === k ? '" + W + "' : '" + G + "'; out['f' + i] = () => this.setState({ f: k }); });\n"
             "vis.forEach((v, i) => { out['v' + i] = v; out['add' + i] = add(i); });\nreturn out;\n}")
phone('Loja-Categoria.dc.html', 'Bodeleve — loja: categoria', 1240, cat, logic_cat)

# ---------- Buscar ----------
BUS = [('Queijo coalho', '500 g', 'R$ 32,90'), ('Queijo manteiga', '500 g', 'R$ 36,90'), ('Carne de sol', '500 g', 'R$ 34,90'), ('Farinha de mandioca', '1 kg', 'R$ 12,90'),
       ('Tapioca granulada', '500 g', 'R$ 9,90'), ('Doce de leite', '400 g', 'R$ 18,90'), ('Rapadura', '400 g', 'R$ 14,50'), ('Manteiga de garrafa', '200 ml', 'R$ 28,00')]
def res(i):
    n, u, p = BUS[i]
    return (f'<sc-if value="{H("r" + str(i))}" hint-placeholder-val="{H("false")}"><a href="Loja-Produto.dc.html" style="display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 8px 0; border-bottom: 1px solid {LN}; text-decoration: none; color: {G}">'
            f'<span role="img" aria-label="Espaço para foto do produto" style="flex: none; width: 48px; height: 48px; border-radius: 10px; background: {C}; border: 1px dashed {G2}"></span>'
            f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{n}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{u}</span></span>'
            f'<span style="font-weight: 600; {NUM}">{p}</span></a></sc-if>')
busca = (titulo('Buscar')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 8px 16px 24px">'
    f'<div style="display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 16px; border-radius: 999px; background: {W}; border: 1.5px solid {G}; color: {G2}">{icon("buscar", 20)}'
    f'<input id="q" type="search" aria-label="Buscar produto" placeholder="Digite o nome do produto" onChange="{H("onBusca")}" style="flex: 1 1 0; min-width: 0; border: 0; background: transparent; font: 400 16px {FB}; color: {G}; outline: none"></div>'
    f'<sc-if value="{H("semBusca")}" hint-placeholder-val="{H("true")}"><div style="display: flex; flex-direction: column; gap: 8px">{h2("Categorias")}'
    + box(rowlink('estoque', 'Queijos e laticínios', '6 produtos', 'Loja-Categoria.dc.html') + rowlink('estoque', 'Carnes e embutidos', '', 'Loja-Categoria.dc.html') + rowlink('estoque', 'Farinhas e grãos', '', 'Loja-Categoria.dc.html')
          + rowlink('estoque', 'Doces', '', 'Loja-Categoria.dc.html') + rowlink('vender', 'Linha Bodeleve', 'Produtos com a marca da casa', 'Loja-Linha.dc.html', True))
    + f'<div style="{SM}">Experimente digitar “queijo” ou “farinha”.</div></div></sc-if>'
    f'<sc-if value="{H("temBusca")}" hint-placeholder-val="{H("false")}"><div style="display: flex; flex-direction: column; gap: 8px"><div aria-live="polite" style="{SM}">{H("conta")}</div>'
    + box(''.join(res(i) for i in range(8)), 'padding-bottom: 0') + '</div></sc-if>'
    f'<sc-if value="{H("nada")}" hint-placeholder-val="{H("false")}"><div style="padding: 32px 20px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px">'
    f'<div aria-hidden="true" style="width: 56px; height: 56px; border-radius: 999px; background: {TS}; color: {TP}; display: flex; align-items: center; justify-content: center">{icon("buscar", 28)}</div>'
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">Nada encontrado para “{H("q")}”</div><div style="{SM}">Confira a escrita ou procure por categoria.</div></div></sc-if></main>'
    + f'<div style="margin-top: auto; flex: none">{nav(1)}</div>')
logic_bus = ("renderVals() {\nconst N = ['Queijo coalho', 'Queijo manteiga', 'Carne de sol', 'Farinha de mandioca', 'Tapioca granulada', 'Doce de leite', 'Rapadura', 'Manteiga de garrafa'];\n"
             "const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');\nconst q = ((this.state && this.state.q) || '').trim();\nconst k = norm(q);\n"
             "const hit = N.map((n) => k.length > 0 && norm(n).indexOf(k) >= 0);\nconst nh = hit.filter(Boolean).length;\n"
             "const out = { q: q, semBusca: k.length === 0, temBusca: nh > 0, nada: k.length > 0 && nh === 0, conta: nh + (nh === 1 ? ' resultado' : ' resultados'), onBusca: (e) => this.setState({ q: e.target.value }) };\n"
             "hit.forEach((h, i) => { out['r' + i] = h; });\nreturn out;\n}")
phone('Loja-Buscar.dc.html', 'Bodeleve — loja: buscar', 940, busca, logic_bus)

# ---------- Meus pedidos ----------
def pedido(num, st, tag, linha, href):
    return (f'<a href="{href}" style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; text-decoration: none; color: {G}; display: flex; flex-direction: column; gap: 6px">'
            f'<span style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-weight: 600; font-size: 17px; {NUM}">Pedido {num}</span>{tag}</span>'
            f'<span style="display: flex; justify-content: space-between; align-items: center; gap: 8px; color: {G2}; font-size: 14px; line-height: 20px; {NUM}"><span>{linha}</span>{icon("avancar", 18, G2)}</span></a>')
pedidos = (titulo('Pedidos')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 8px 16px 24px"><div style="display: flex; flex-direction: column; gap: 8px">{h2("Em andamento")}'
    + pedido('1042', '', tagc('Saiu para entrega', IN_T, IN_B), 'Hoje · 4 itens · R$ 81,20', 'Loja-Acompanhamento.dc.html') + '</div>'
    + f'<div style="display: flex; flex-direction: column; gap: 8px">{h2("Anteriores")}'
    + pedido('1017', '', tagc('Entregue', OK_T, OK_B), '02/11 · 4 itens · R$ 96,60', 'Loja-Pedido.dc.html') + pedido('0988', '', tagc('Retirado', OK_T, OK_B), '21/10 · 2 itens · R$ 45,80', 'Loja-Pedido.dc.html') + '</div>'
    + f'<div style="padding: 14px 16px; border-radius: 12px; background: {TS}; display: flex; flex-direction: column; gap: 4px"><div style="font-weight: 600">Comprou sem conta?</div>'
      f'<div style="font-size: 14px; line-height: 20px">Estes são os pedidos feitos neste aparelho. Entre para ver todos.</div>{linkq("Entrar", "Loja-Entrar.dc.html", TP)}</div></main>'
    + f'<div style="margin-top: auto; flex: none">{nav(2)}</div>')
phone('Loja-Pedidos.dc.html', 'Bodeleve — loja: pedidos', 760, pedidos, VAZIO)

# ---------- Acompanhamento ----------
acomp = (bar2('Pedido 1042', 'Loja-Pedidos.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 4px 16px 24px">'
    f'<div style="padding: 20px; border-radius: 20px; background: {V}; color: {W}; display: flex; flex-direction: column; gap: 4px"><div style="font-size: 14px; line-height: 20px">Previsão de entrega</div>'
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px; {NUM}">Hoje, 15h40</div><div style="font-size: 15px; line-height: 22px">Seu pedido saiu para entrega.</div></div>'
    f'<div style="padding: 16px; border-radius: 12px; background: {TS}; display: flex; align-items: center; justify-content: space-between; gap: 16px"><div><div style="font-weight: 600; color: {TP}">Código de entrega</div>'
    f'<div style="font-size: 13px; line-height: 18px">Informe ao entregador ao receber.</div></div><div style="font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px; letter-spacing: 0.08em; color: {TP}; {NUM}">4821</div></div>'
    f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}"><ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 14px">'
    + passo('Pedido recebido', '14h52', 'ok') + passo('Em preparo', '14h58', 'ok') + passo('Saiu para entrega', '15h12 · com Carlos, entregador da casa', 'agora') + passo('Entregue', '', 'depois') + '</ol></div>'
    f'<div style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 6px"><div style="font-weight: 600">Entrega</div>'
    f'<div style="color: {G2}">Rua das Camélias, 120 · apto 34 — Jardim das Flores</div></div>'
    f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}"><div style="font-weight: 600">Resumo</div>'
    + li('1 × Queijo coalho', 'R$ 32,90') + li('2 × Farinha de mandioca', 'R$ 25,80') + li('1 × Rapadura', 'R$ 14,50') + li('Entrega', 'R$ 8,00')
    + f'<div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid {LN}; font-weight: 600"><span>Total · Pix</span><span>R$ 81,20</span></div></div>'
    f'<div style="{SM}">Precisa de ajuda? Fale com a loja: [WHATSAPP DA LOJA]</div></main>')
phone('Loja-Acompanhamento.dc.html', 'Bodeleve — loja: acompanhamento', 1040, acomp, VAZIO)

# ---------- Detalhe e recompra ----------
def lin(q, n, p, off=False):
    t = tagc('Indisponível hoje', AT_T, AT_B) if off else ''
    return (f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}"><div style="min-width: 0"><div style="font-weight: 600; color: {G2 if off else G}">{q} × {n}</div>{t}</div>'
            f'<div style="color: {G2}">{p}</div></div>')
det = (bar2('Pedido 1017', 'Loja-Pedidos.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 4px 16px 24px"><div style="display: flex; align-items: center; gap: 10px">{tagc("Entregue", OK_T, OK_B)}<span style="{SM}; {NUM}">02/11/2026, às 11h20</span></div>'
    + box(lin(2, 'Queijo coalho', 'R$ 65,80') + lin(1, 'Tapioca granulada', 'R$ 9,90', True) + lin(1, 'Farinha de mandioca', 'R$ 12,90')
          + f'<div style="display: flex; justify-content: space-between; padding: 12px 0; color: {G2}; {NUM}"><span>Entrega</span><span>R$ 8,00</span></div>'
          + f'<div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 1px solid {LN}; font-weight: 600; font-size: 18px; {NUM}"><span>Total</span><span>R$ 96,60</span></div>')
    + f'<div role="status" style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; background: {AT_B}; color: {AT_T}; font-size: 14px; line-height: 20px; font-weight: 500">{icon("alerta", 20)}<span>1 item está indisponível hoje e fica fora do novo pedido.</span></div></main>'
    + rodape(cta('Pedir de novo · 3 itens', 'Loja-Sacola.dc.html') + f'<div style="{SM}; text-align: center">Você confere tudo na sacola antes de pagar.</div>'))
phone('Loja-Pedido.dc.html', 'Bodeleve — loja: detalhe do pedido', 760, det, VAZIO)

# ---------- Perfil ----------
perfil = (titulo('Perfil')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 8px 16px 24px">'
    f'<div style="padding: 20px; border-radius: 20px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 12px"><div><div style="font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">Você está comprando sem conta</div>'
    f'<div style="{SM}">Com uma conta você vê seus pedidos em qualquer aparelho e pede de novo em um toque.</div></div>' + cta('Entrar ou criar conta', 'Loja-Entrar.dc.html', 'height: 48px') + '</div>'
    + box(rowlink('pedidos', 'Meus pedidos', 'Acompanhar e pedir de novo', 'Loja-Pedidos.dc.html') + rowlink('local', 'Endereço de entrega', 'Rua das Camélias, 120', 'Loja-Endereco.dc.html', True))
    + box(rowlink('vender', 'Linha Bodeleve', 'Produtos com a marca da casa', 'Loja-Linha.dc.html') + rowlink('inicio', 'Sobre a Bodeleve', 'A casa, o que produz e onde fica', 'Loja-Sobre.dc.html', True))
    + f'<div style="{SM}">Atendimento: [WHATSAPP DA LOJA] · [HORÁRIO DE FUNCIONAMENTO]</div></main>'
    + f'<div style="margin-top: auto; flex: none">{nav(3)}</div>')
phone('Loja-Perfil.dc.html', 'Bodeleve — loja: perfil', 800, perfil, VAZIO)

# ---------- Entrar ----------
entrar = (bar2('Entrar', 'Loja-Perfil.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 4px 16px 24px">'
    f'<sc-if value="{H("p1")}" hint-placeholder-val="{H("true")}">{h1("Entre com seu celular")}<div style="{SM}">Sem senha: enviamos um código de 4 dígitos pelo WhatsApp. Se for sua primeira vez, a conta é criada na hora.</div>'
    + campo('cel2', 'Celular com WhatsApp', '(00) 90000-0000', '', 'tel', 'tel')
    + f'<button type="button" onClick="{H("pedir")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}">Receber código</button></sc-if>'
    f'<sc-if value="{H("p2")}" hint-placeholder-val="{H("false")}">{h1("Digite o código")}<div style="{SM}; {NUM}">Enviado para (00) 90000-0000.</div>'
    f'<div role="group" aria-label="Código de 4 dígitos" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">'
    + ''.join(f'<input type="text" inputmode="numeric" maxlength="1" aria-label="Dígito {i + 1}" style="height: 56px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; text-align: center; font: 600 22px {FB}; color: {G}; box-sizing: border-box; width: 100%">' for i in range(4)) + '</div>'
    + cta('Entrar', 'Loja-Perfil.dc.html')
    + f'<button type="button" onClick="{H("voltar")}" style="height: 48px; border: 0; background: transparent; color: {T}; font: 600 16px {FB}">Usar outro número</button></sc-if>'
    f'<div style="padding-top: 8px; border-top: 1px solid {LN}">{linkq("Continuar sem conta", "Loja-Inicio.dc.html")}</div></main>')
logic_entrar = ("renderVals() {\nconst p = (this.state && this.state.p) || 1;\nreturn { p1: p === 1, p2: p === 2, pedir: () => this.setState({ p: 2 }), voltar: () => this.setState({ p: 1 }) };\n}")
phone('Loja-Entrar.dc.html', 'Bodeleve — loja: entrar', 620, entrar, logic_entrar)

# ---------- Linha Bodeleve ----------
linha = (topbar('', 'Loja-Inicio.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 24px; padding: 4px 16px 24px">'
    f'<div style="padding: 28px 20px; border-radius: 20px; background: {T}; color: {W}; display: flex; flex-direction: column; gap: 12px"><div style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase">Marca da casa</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 40px; line-height: 44px; letter-spacing: -0.02em">Linha Bodeleve</h1>'
    f'<div style="font-size: 16px; line-height: 24px">[TEXTO DA LINHA: o que é, por que existe, o que garante]</div></div>'
    f'<div style="display: flex; flex-direction: column; gap: 12px"><div>{h2("Produtos da linha")}<div style="{SM}">{H("conta")}</div></div>'
    f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">' + pcard('Rapadura', '400 g', 'R$ 14,50', 'marca', 'add0') + pcard('Manteiga de garrafa', '200 ml', 'R$ 28,00', 'marca', 'add1') + '</div></div>'
    f'<div style="padding: 20px; border-radius: 20px; background: {W}; border: 1px dashed {G2}; display: flex; flex-direction: column; gap: 6px">{h2("Em breve")}<div style="color: {G2}">[PRÓXIMOS PRODUTOS DA LINHA]</div></div>'
    f'<div style="display: flex; flex-direction: column; gap: 12px">{h2("Como é feita")}'
    + ''.join(f'<div style="display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}">{icon(ic, 22, T)}<div><div style="font-weight: 600">{t}</div><div style="{SM}">{d}</div></div></div>'
              for ic, t, d in (('producao', 'Onde é produzida', '[NA CASA OU POR PARCEIRO]'), ('validade', 'Lote e validade', 'Cada produto traz lote e data na embalagem.'), ('confirmar', 'O que a marca garante', '[COMPROMISSO DA MARCA]'))) + '</div></main>'
    + f'<div style="margin-top: auto; flex: none; display: flex; flex-direction: column">{sacbar()}</div>')
logic_linha = ('renderVals() {\n' + FMT + "\nconst P = [14.5, 28];\nconst q = (this.state && this.state.q) || [0, 0];\nconst n = q[0] + q[1];\nconst add = (i) => () => { const c = q.slice(); c[i] = c[i] + 1; this.setState({ q: c }); };\n"
               "return { conta: '2 produtos', tem: n > 0, itens: n + (n === 1 ? ' item' : ' itens'), total: fmt(q[0] * P[0] + q[1] * P[1]), add0: add(0), add1: add(1) };\n}")
phone('Loja-Linha.dc.html', 'Bodeleve — loja: linha Bodeleve', 1240, linha, logic_linha)

# ---------- Sobre ----------
sobre = (topbar('', 'Loja-Inicio.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 24px; padding: 4px 16px 24px">'
    f'<div role="img" aria-label="Espaço para foto da casa" style="height: 220px; border-radius: 20px; background: {W}; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: {G2}">[FOTO DA CASA]</div>'
    f'<div style="display: flex; flex-direction: column; gap: 8px"><div style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {T}">Sobre a Bodeleve</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px; letter-spacing: -0.01em">Uma Casa do Norte</h1>'
    f'<p style="margin: 0; color: {G2}">[HISTÓRIA DA CASA: quem fundou, quando, de onde vêm as receitas e os produtos]</p></div>'
    f'<div style="display: flex; flex-direction: column; gap: 12px">{h2("O que você encontra aqui")}'
    + ''.join(f'<div style="padding: 16px; border-radius: 12px; background: {bg}; color: {fg}; display: flex; flex-direction: column; gap: 4px"><div style="font-family: {FD}; font-weight: 700; font-size: 18px; line-height: 24px">{t}</div><div style="font-size: 14px; line-height: 20px">{d}</div></div>'
              for t, d, bg, fg in (('Feito na casa', 'Produtos preparados aqui, em pequenos lotes.', V, W), ('Marca Bodeleve', 'A linha que leva o nome da casa.', T, W), ('Escolhidos pela casa', 'Produtos regionais de fornecedores selecionados.', W, G))) + '</div>'
    f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 10px">{h2("Venha conhecer")}'
    f'<div style="display: flex; gap: 10px; align-items: flex-start">{icon("local", 20, G2)}<span>[ENDEREÇO DA LOJA]</span></div><div style="display: flex; gap: 10px; align-items: flex-start">{icon("historico", 20, G2)}<span>[HORÁRIO DE FUNCIONAMENTO]</span></div></div></main>'
    + rodape(cta('Ver produtos', 'Loja-Inicio.dc.html')))
phone('Loja-Sobre.dc.html', 'Bodeleve — loja: sobre', 1120, sobre, VAZIO)
