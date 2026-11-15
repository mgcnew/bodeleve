from b13_financeiro import *   # regenera lotes 1 a 5 e traz os auxiliares

def switch(lbl_id, label, sub, val, on):
    return (f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; padding: 8px 0; border-bottom: 1px solid {LN}">'
            f'<span id="{lbl_id}" style="min-width: 0"><span style="display: block; font-weight: 600">{label}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{sub}</span></span>'
            f'<button type="button" role="switch" aria-checked="{H(val)}" aria-labelledby="{lbl_id}" onClick="{H(on)}" style="flex: none; width: 60px; height: 44px; border: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center">'
            f'<span aria-hidden="true" style="width: 52px; height: 32px; box-sizing: border-box; border-radius: 999px; background: {H(val + "Bg")}; padding: 4px; display: flex; justify-content: {H(val + "Js")}"><span style="width: 24px; height: 24px; border-radius: 999px; background: {W}"></span></span></button></div>')
def switch_logic(name, default):
    return (f"const {name} = st.{name} === undefined ? {str(default).lower()} : st.{name};\n"
            f"out.{name} = {name}; out.{name}Bg = {name} ? '{V}' : '{LN}'; out.{name}Js = {name} ? 'flex-end' : 'flex-start'; out.t_{name} = () => this.setState({{ {name}: !{name} }});\n")
def radio2(fid, grupo, t, sub, on=False):
    return (f'<label for="{fid}" style="display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 8px 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
            f'<input id="{fid}" type="radio" name="{grupo}"{" checked" if on else ""} style="flex: none; width: 22px; height: 22px; accent-color: {T}; margin: 0">'
            f'<span><b>{t}</b>' + (f'<span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{sub}</span>' if sub else '') + '</span></label>')
fieldset = lambda leg, inner: f'<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 8px"><legend style="padding: 0; margin-bottom: 8px; font-weight: 600">{leg}</legend>{inner}</fieldset>'
busca = lambda ph: (f'<div style="display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 16px; border-radius: 999px; background: {W}; border: 1.5px solid {LN}; color: {G2}">{icon("buscar", 20)}'
                    f'<input type="search" aria-label="{ph}" placeholder="{ph}" style="flex: 1 1 0; min-width: 0; border: 0; background: transparent; font: 400 16px {FB}; color: {G}; outline: none"></div>')
salvo = lambda t: (f'<sc-if value="{H("salvo")}" hint-placeholder-val="{H("false")}"><div role="status" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; background: {G}; color: {C}; font-size: 14px; line-height: 20px">'
                   f'{icon("confirmar", 20)}<span>{t}</span></div></sc-if>')
btn_salvar = lambda t='Salvar': f'<button type="button" onClick="{H("salvar")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}; width: 100%">{t}</button>'

# ---------- Produtos ----------
PROD = [  # nome, origem, preço, canal, href
    ('Queijo coalho 500 g', 'casa', 'R$ 32,90', 'Loja e balcão', 'Gestao-Produto.dc.html'),
    ('Queijo manteiga 500 g', 'casa', 'R$ 36,90', 'Loja e balcão', None),
    ('Doce de leite 400 g', 'casa', 'R$ 18,90', 'Loja e balcão', None),
    ('Rapadura 400 g', 'marca', 'R$ 14,50', 'Loja e balcão', None),
    ('Manteiga de garrafa 200 ml', 'marca', 'R$ 28,00', 'Loja e balcão', None),
    ('Carne de sol', 'rev', 'R$ 59,90 / kg', 'Só balcão (por peso)', None),
    ('Farinha de mandioca 1 kg', 'rev', 'R$ 12,90', 'Loja e balcão', None),
    ('Leite integral 1 L', 'mp', '—', 'Não vende', None),
]
FILT = ['casa', 'marca', 'rev', 'mp']
def prow(i):
    n, o, p, c, href = PROD[i]
    inner = (f'<span style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 4px"><span style="font-weight: 600">{n}</span><span>{ORIG[o]}</span>'
             f'<span style="font-size: 13px; line-height: 18px; color: {G2}">{c}</span></span><span style="flex: none; font-weight: 700; {NUM}">{p}</span>')
    st = f'display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; text-decoration: none; color: {G}'
    row = f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>' if href else f'<div style="{st}">{inner}</div>'
    return f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true")}">{row}</sc-if>'
produtos = (bar('Produtos', 'Gestao-Mais.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">{busca("Buscar produto")}'
    f'<div role="group" aria-label="Filtrar por tipo" style="display: flex; gap: 8px; flex-wrap: wrap">' + chips(['Todos', 'Feitos na casa', 'Marca Bodeleve', 'Revenda', 'Matéria-prima']) + '</div>'
    + box(''.join(prow(i) for i in range(len(PROD))), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="display: flex; gap: 8px">' + link2('Categorias', 'Gestao-Categorias.dc.html') + link2('Fichas técnicas', 'Gestao-Fichas.dc.html') + '</div>'
    + f'<div style="{SM}">41 itens cadastrados; a lista mostra 8 de exemplo.</div></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(4)}</div>')
logic_produtos = ("renderVals() {\nconst O = [" + ', '.join("'" + p[1] + "'" for p in PROD) + "];\nconst F = [null, 'casa', 'marca', 'rev', 'mp'];\nconst t = (this.state && this.state.t) || 0;\nconst out = {};\n"
                  "O.forEach((o, i) => { out['v' + i] = t === 0 || o === F[t]; });\n" + chips_logic(5) + "return out;\n}")
gphone('Gestao-Produtos.dc.html', 'Bodeleve — gestão: produtos', 1220, produtos, logic_produtos)

# ---------- Produto (editar) ----------
produto = (bar('Queijo coalho 500 g', 'Gestao-Produtos.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div role="img" aria-label="Espaço para foto do produto" style="height: 160px; border-radius: 16px; background: {C}; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: {G2}">[FOTO DO PRODUTO]</div>'
    + campo('pn', 'Nome', 'Queijo coalho 500 g') + sel('pc', 'Categoria', ['Queijos e laticínios', 'Carnes e embutidos', 'Farinhas e grãos', 'Doces'])
    + fieldset('Tipo de item', radio2('ti0', 'tipo', 'Produto acabado', 'Produzido a partir de uma ficha técnica', True) + radio2('ti1', 'tipo', 'Revenda', 'Comprado pronto de fornecedor') + radio2('ti2', 'tipo', 'Matéria-prima', 'Usado na produção, não é vendido'))
    + fieldset('Origem na loja', radio2('or0', 'orig', 'Feito na casa', '', True) + radio2('or1', 'orig', 'Marca Bodeleve', 'Feito na casa ou por parceiro, com a marca') + radio2('or2', 'orig', 'Terceiros', 'Sem selo na loja'))
    + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">'
    + f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="pp" style="font-size: 14px; line-height: 20px; font-weight: 600">Preço de venda</label><input id="pp" type="text" inputmode="decimal" value="32,90" onChange="{H("onPreco")}" style="height: 48px; padding: 0 14px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}; box-sizing: border-box; width: 100%"></div>'
    + campo('pm', 'Estoque mínimo', '15 un', '', 'text', ' inputmode="numeric"') + '</div>'
    + card(li('Custo (da ficha técnica)', 'R$ 14,20') + f'<div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid {LN}; font-weight: 600; {NUM}"><span>Margem</span><span>{H("margem")}</span></div>')
    + box(switch('s1', 'Publicar na loja online', 'Aparece no catálogo para clientes', 'loja', 't_loja') + switch('s2', 'Favorito no PDV', 'Fica na primeira tela do balcão', 'fav', 't_fav')
          + switch('s3', 'Vendido por peso', 'Pede o peso na hora da venda', 'peso', 't_peso') + switch('s4', 'Controlar lote e validade', 'Obrigatório para alimentos perecíveis', 'lote', 't_lote').replace(f'border-bottom: 1px solid {LN}', 'border-bottom: 0', 1), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="pd" style="font-size: 14px; line-height: 20px; font-weight: 600">Descrição na loja</label>'
      f'<textarea id="pd" rows="3" style="padding: 12px 14px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}; resize: vertical">[DESCRIÇÃO DO PRODUTO]</textarea></div>'
    + salvo('Produto salvo.') + '</main>' + rodape(btn_salvar()))
logic_produto = ("renderVals() {\nconst st = this.state || {};\nconst out = {};\n" + switch_logic('loja', True) + switch_logic('fav', True) + switch_logic('peso', False) + switch_logic('lote', True)
                 + "const p = st.p === undefined ? 32.9 : st.p;\nout.margem = p > 0 ? Math.round((p - 14.2) / p * 100) + '%' : '—';\n"
                 "out.onPreco = (e) => { const v = parseFloat(String(e.target.value).replace(/\\./g, '').replace(',', '.')); this.setState({ p: isNaN(v) ? 0 : v }); };\n"
                 "out.salvo = !!st.salvo; out.salvar = () => this.setState({ salvo: true });\nreturn out;\n}")
gphone('Gestao-Produto.dc.html', 'Bodeleve — gestão: produto', 2000, produto, logic_produto)

# ---------- Categorias ----------
CATS = [('Queijos e laticínios', 6), ('Carnes e embutidos', 5), ('Farinhas e grãos', 8), ('Doces', 5), ('Temperos e conservas', 7), ('Bebidas', 4)]
def catrow(i):
    n, c = CATS[i]
    return (f'<div style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 0; border-bottom: 1px solid {LN}"><span style="flex: 1 1 0; min-width: 0"><b>{n}</b>'
            f'<span style="display: block; font-size: 13px; line-height: 18px; color: {G2}; {NUM}">{c} produtos</span></span>{tagc("Na loja", OK_T, OK_B)}</div>')
cats = (bar('Categorias', 'Gestao-Produtos.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    + box(''.join(catrow(i) for i in range(len(CATS)))
          + f'<sc-for list="{H("novas")}" as="c" hint-placeholder-count="0"><div style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 0; border-bottom: 1px solid {LN}"><span style="flex: 1 1 0; min-width: 0"><b>{{{{ c.nome }}}}</b>'
            f'<span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">0 produtos</span></span>{tagc("Nova", IN_T, IN_B)}</div></sc-for>', 'padding-top: 0; padding-bottom: 0')
    + f'<div style="display: flex; gap: 8px; align-items: flex-end"><div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 6px"><label for="nc" style="font-size: 14px; line-height: 20px; font-weight: 600">Nova categoria</label>'
      f'<input id="nc" type="text" placeholder="Ex.: Castanhas" value="{H("txt")}" onChange="{H("onTxt")}" style="height: 48px; padding: 0 14px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}; box-sizing: border-box; width: 100%"></div>'
      f'<button type="button" onClick="{H("add")}" style="flex: none; height: 48px; padding: 0 18px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}">Adicionar</button></div>'
    + f'<div style="{SM}">A ordem aqui é a ordem dos atalhos na loja online.</div></main>')
logic_cats = ("renderVals() {\nconst st = this.state || {};\nconst novas = st.novas || [];\nconst txt = st.txt || '';\n"
              "return { novas: novas, txt: txt, onTxt: (e) => this.setState({ txt: e.target.value }), add: () => { const n = (txt || '').trim(); if (n) this.setState({ novas: novas.concat([{ nome: n }]), txt: '' }); } };\n}")
gphone('Gestao-Categorias.dc.html', 'Bodeleve — gestão: categorias', 900, cats, logic_cats)

# ---------- Clientes ----------
CLI = [('Maria Lima', '5 pedidos · último hoje', 'R$ 412,30', '', 'Gestao-Cliente.dc.html'), ('Ana Souza', '3 pedidos · último hoje', 'R$ 236,10', '', None),
       ('Dona Zefa', 'Balcão · compra fiado', 'R$ 1.020,00', tagc('Fiado R$ 160,00', AT_T, AT_B), None), ('Paula Reis', '8 pedidos · último hoje', 'R$ 904,70', '', None),
       ('João Pedro', '1 pedido · hoje', 'R$ 47,80', tagc('Novo', IN_T, IN_B), None)]
def clirow(i):
    n, s, v, tag, href = CLI[i]
    bd = '' if i == len(CLI) - 1 else f'border-bottom: 1px solid {LN}; '
    inner = (f'<span aria-hidden="true" style="flex: none; width: 40px; height: 40px; border-radius: 999px; background: {C}; display: flex; align-items: center; justify-content: center; font-weight: 700">{n[0]}</span>'
             f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{n}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{s}</span></span>'
             f'<span style="flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 4px"><span style="font-weight: 700; {NUM}">{v}</span>{tag}</span>')
    st = f'display: flex; align-items: center; gap: 12px; padding: 12px 0; {bd}text-decoration: none; color: {G}'
    return f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>' if href else f'<div style="{st}">{inner}</div>'
clientes = (bar('Clientes', 'Gestao-Mais.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">{busca("Nome ou celular")}'
    + box(''.join(clirow(i) for i in range(len(CLI))), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Valor ao lado = total comprado. Quem compra na loja sem conta entra aqui pelo celular informado.</div></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(4)}</div>')
gphone('Gestao-Clientes.dc.html', 'Bodeleve — gestão: clientes', 800, clientes, VAZIO)

# ---------- Cliente ----------
cliente = (bar('Cliente', 'Gestao-Clientes.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div><div style="font-family: {FD}; font-weight: 700; font-size: 26px; line-height: 32px">Maria Lima</div><div style="{SM}">Cliente desde 03/2026 · compra pela loja online</div></div>'
    f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">'
    + ''.join(f'<div style="padding: 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}; min-width: 0"><div style="font-size: 12px; line-height: 16px; color: {G2}">{t}</div><div style="font-weight: 700; font-size: 18px; line-height: 24px; {NUM}">{v}</div></div>'
              for t, v in (('Pedidos', '5'), ('Total', 'R$ 412,30'), ('Ticket médio', 'R$ 82,46'))) + '</div>'
    + card(f'<div style="font-weight: 600">Contato</div><div style="color: {G2}; {NUM}">(00) 90000-0001 · WhatsApp<br>Av. das Palmeiras, 455 · casa 2 — Centro</div>')
    + f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Mais compra")}<div style="display: flex; gap: 8px; flex-wrap: wrap">'
    + ''.join(tagc(t, G, C) for t in ('Queijo coalho · 5×', 'Farinha de mandioca · 3×', 'Tapioca · 2×')) + '</div></section>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Pedidos")}'
    + box(money_row('#1043 · hoje', 'Entrega · 3 itens', 'R$ 63,70', G, tagc('Novo', IN_T, IN_B), 'Gestao-Pedido.dc.html')
          + money_row('#1021 · 06/11', 'Entrega · 4 itens', 'R$ 98,40', G, tagc('Entregue', OK_T, OK_B))
          + money_row('#0997 · 24/10', 'Retirada · 6 itens', 'R$ 121,60', G, tagc('Retirado', OK_T, OK_B), None, True), 'padding-top: 0; padding-bottom: 0') + '</section>'
    + f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="obs" style="font-size: 14px; line-height: 20px; font-weight: 600">Observações internas</label>'
      f'<textarea id="obs" rows="2" style="padding: 12px 14px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}; resize: vertical">Prefere queijo mais curado.</textarea></div>'
    + f'<div style="{SM}">Dados pessoais só para atender e entregar. A cliente pode pedir para apagar a conta.</div></main>')
gphone('Gestao-Cliente.dc.html', 'Bodeleve — gestão: cliente', 1180, cliente, VAZIO)

# ---------- Entregas (painel) ----------
ENT = [  # aba, pedido, linha, tag, href
    (0, '#1041 · Paula Reis', 'Pronto há 6 min · Bairro Alto · 4,1 km', tagc('Pronto', OK_T, OK_B), 'Gestao-Atribuir.dc.html'),
    (0, '#1043 · Maria Lima', 'Em separação · Centro · 1,8 km', tagc('Em preparo', AT_T, AT_B), None),
    (1, '#1042 · Ana Souza', 'Carlos (próprio) · saiu 15h12 · previsão 15h40', tagc('Em rota', IN_T, IN_B), None),
    (2, '#1038 · Rafael Dias', 'Bruno (próprio) · entregue 13h05', tagc('Entregue', OK_T, OK_B), None),
    (2, '#1036 · Paula Reis', 'Parceiro · entregue 11h48', tagc('Entregue', OK_T, OK_B), None),
]
def entcard(i):
    a, p, l, tag, href = ENT[i]
    inner = f'<span style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><b>{p}</b>{tag}</span><span style="font-size: 14px; line-height: 20px; color: {G2}; {NUM}">{l}</span>'
    st = f'padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; text-decoration: none; color: {G}; display: flex; flex-direction: column; gap: 4px'
    c = f'<a href="{href}" style="{st}">{inner}</a>' if href else f'<div style="{st}">{inner}</div>'
    return f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true" if a == 0 else "false")}">{c}</sc-if>'
def courier(n, tipo, s, tag, last=False):
    bd = '' if last else f'border-bottom: 1px solid {LN}; '
    return (f'<div style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 0; {bd}"><span aria-hidden="true" style="flex: none; width: 36px; height: 36px; border-radius: 999px; background: {C}; display: flex; align-items: center; justify-content: center; font-weight: 700">{n[0]}</span>'
            f'<span style="flex: 1 1 0; min-width: 0"><b>{n}</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{tipo} · {s}</span></span>{tag}</div>')
entregas = (bar('Entregas', 'Gestao-Mais.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div role="group" aria-label="Filtrar entregas" style="display: flex; gap: 8px; flex-wrap: wrap">' + chips(['Para sair · 2', 'Em rota · 1', 'Entregues · 2']) + '</div>'
    + '<div style="display: flex; flex-direction: column; gap: 10px">' + ''.join(entcard(i) for i in range(len(ENT))) + '</div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Entregadores")}'
    + box(courier('Carlos', 'Próprio', 'em rota com #1042, volta 15h50', tagc('Em rota', IN_T, IN_B)) + courier('Bruno', 'Próprio', 'na loja', tagc('Disponível', OK_T, OK_B))
          + courier('Parceiros', 'Avulsos', '2 com o app aberto agora', tagc('2 online', G, C), True), 'padding-top: 0; padding-bottom: 0') + '</section></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(4)}</div>')
logic_ent = ("renderVals() {\nconst A = [" + ', '.join(str(e[0]) for e in ENT) + "];\nconst t = (this.state && this.state.t) || 0;\nconst out = {};\nA.forEach((a, i) => { out['v' + i] = a === t; });\n" + chips_logic(3) + "return out;\n}")
gphone('Gestao-Entregas.dc.html', 'Bodeleve — gestão: entregas', 1000, entregas, logic_ent)

# ---------- Atribuir entrega ----------
def opc(k, t, sub, extra=''):
    return (f'<button type="button" aria-pressed="{H("a" + str(k))}" onClick="{H("o" + str(k))}" style="display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 10px 14px; border-radius: 12px; '
            f'border: {H("bd" + str(k))}; background: {W}; color: {G}; text-align: left; font: 400 14px {FB}; width: 100%"><span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600; font-size: 16px">{t}</span>'
            f'<span style="display: block; color: {G2}">{sub}</span></span>{extra}</button>')
atrib = (bar('Enviar pedido #1041', 'Gestao-Entregas.dc.html')
    + f'<sc-if value="{H("escolhendo")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    + card(f'<div style="display: flex; justify-content: space-between; gap: 8px"><b>Paula Reis</b>{tagc("Pronto", OK_T, OK_B)}</div>'
           f'<div style="display: flex; gap: 10px; align-items: flex-start; color: {G2}">{icon("local", 20, G2)}<span>Rua do Sol, 88 · Bairro Alto<br>4,1 km · 6 itens · pago no Pix</span></div>')
    + f'<div style="display: flex; flex-direction: column; gap: 8px"><div id="quem" style="font-weight: 600">Quem leva</div><div role="group" aria-labelledby="quem" style="display: flex; flex-direction: column; gap: 8px">'
    + opc(0, 'Bruno · próprio', 'Na loja agora · sai em seguida', tagc('Disponível', OK_T, OK_B)) + opc(1, 'Carlos · próprio', 'Volta às 15h50 · pode levar junto na próxima saída', tagc('Em rota', IN_T, IN_B))
    + opc(2, 'Publicar para parceiros', 'O primeiro que aceitar leva · 2 online', f'<span style="font-weight: 700; {NUM}">R$ 9,00</span>') + '</div></div>'
    + f'<div style="{SM}">Entregador próprio recebe por mês; parceiro recebe por entrega, no valor mostrado.</div></main>'
    + rodape(f'<button type="button" onClick="{H("enviar")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}; width: 100%">{H("botao")}</button>') + '</sc-if>'
    f'<sc-if value="{H("feito")}" hint-placeholder-val="{H("false")}"><main style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 48px 24px">'
    f'<div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("entregas", 32)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">{H("titulo")}</h1><div style="color: {G2}">{H("resumo")}</div></main>'
    + rodape(cta('Voltar às entregas', 'Gestao-Entregas.dc.html') + f'<button type="button" onClick="{H("desfazer")}" style="height: 48px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}">Desfazer</button>') + '</sc-if>')
logic_atrib = ("renderVals() {\nconst st = this.state || {};\nconst o = st.o || 0;\nconst feito = !!st.feito;\n"
               f"const on = '2px solid {G}', off = '1.5px solid {LN}';\n"
               "const B = ['Enviar com o Bruno', 'Reservar para o Carlos', 'Publicar por R$ 9,00'];\n"
               "const T = ['Bruno recebeu a entrega', 'Reservado para o Carlos', 'Publicado para parceiros'];\n"
               "const R = ['O pedido apareceu no app do Bruno. A cliente recebe o aviso quando ele sair.', 'Entra na lista do Carlos quando ele voltar, às 15h50.', 'Avisamos aqui quando um parceiro aceitar. Se ninguém aceitar em 10 min, volta para você.'];\n"
               "const out = { escolhendo: !feito, feito: feito, botao: B[o], titulo: T[o], resumo: R[o], enviar: () => this.setState({ feito: true }), desfazer: () => this.setState({ feito: false }) };\n"
               "[0, 1, 2].forEach((k) => { out['a' + k] = o === k; out['bd' + k] = o === k ? on : off; out['o' + k] = () => this.setState({ o: k }); });\nreturn out;\n}")
gphone('Gestao-Atribuir.dc.html', 'Bodeleve — gestão: atribuir entrega', 900, atrib, logic_atrib)

# ---------- Relatórios (hub) ----------
def rep(t, sub, v, href=None, last=False):
    return money_row(t, sub, v, G, '', href, last)
rels = (bar('Relatórios', 'Gestao-Mais.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px"><div style="{SM}">Números de novembro até hoje. Toque em Vendas para ver por período.</div>'
    + box(rep('Vendas', 'Balcão e loja online, por dia e forma de pagamento', 'R$ 14.326,80', 'Gestao-Relatorio.dc.html')
          + rep('Produtos', 'Mais vendido: Queijo coalho · 214 un', '86 itens')
          + rep('Estoque e perdas', 'Perdas no mês: 9 itens', '− R$ 128,40')
          + rep('Produção', '11 ordens · rendimento médio 96%', '238 un')
          + rep('Resultado do mês', 'Vendas menos custos e despesas pagas', 'R$ 3.912,60', None, True), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Todos os relatórios exportam em planilha (.xlsx) e PDF.</div></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(4)}</div>')
gphone('Gestao-Relatorios.dc.html', 'Bodeleve — gestão: relatórios', 760, rels, VAZIO)

# ---------- Relatório de vendas ----------
DAYS = ['08/11', '09/11', '10/11', '11/11', '12/11', '13/11', '14/11']
def barcol(i):
    return (f'<button type="button" aria-label="{DAYS[i]}: {H("bl" + str(i))}" onClick="{H("pick" + str(i))}" style="flex: 1 1 0; min-width: 0; height: 160px; border: 0; padding: 0; background: transparent; '
            f'display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px">'
            f'<span style="width: 22px; height: {H("bh" + str(i))}; border-radius: 4px 4px 0 0; background: {H("bc" + str(i))}"></span>'
            f'<span style="font-size: 12px; line-height: 16px; color: {G2}; {NUM}">{DAYS[i][:2]}</span></button>')
rel = (bar('Vendas', 'Gestao-Relatorios.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div role="group" aria-label="Período" style="display: flex; gap: 8px">' + chips(['Hoje', '7 dias', 'Mês']) + '</div>'
    f'<div style="display: flex; flex-direction: column; gap: 2px"><span style="{SM}">{H("periodo")}</span><span style="font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px; {NUM}">{H("total")}</span>'
    f'<span style="{SM}; {NUM}">{H("sub")}</span></div>'
    f'<sc-if value="{H("semana")}" hint-placeholder-val="{H("false")}"><section style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px">'
    f'<div style="display: flex; justify-content: space-between; gap: 8px"><b>Vendas por dia</b><span style="{SM}; {NUM}">{H("sel")}</span></div>'
    f'<div style="display: flex; gap: 4px; align-items: flex-end; border-bottom: 1px solid {LN}">' + ''.join(barcol(i) for i in range(7)) + '</div>'
    f'<div style="font-size: 12px; line-height: 16px; color: {G2}">Toque numa barra para ver o valor do dia. Sexta e sábado vendem mais.</div></section></sc-if>'
    f'<section style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}"><b>Por canal</b>'
    + li('Balcão', H('bal')) + li('Loja online', H('onl')) + '</section>'
    f'<section style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}"><b>Por forma de pagamento</b>'
    + li('Pix', H('pix')) + li('Cartão', H('car')) + li('Dinheiro', H('din')) + '</section>'
    f'<section style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}"><b>Mais vendidos</b>'
    + li('Queijo coalho 500 g', H('p1')) + li('Farinha de mandioca 1 kg', H('p2')) + li('Carne de sol', H('p3')) + '</section>'
    + f'<a href="#" aria-disabled="true" style="display: none">.</a>'
    + f'<div style="{SM}">Exportar em planilha ou PDF fica no menu de compartilhar do aparelho.</div></main>')
logic_rel = ("renderVals() {\nconst st = this.state || {};\nconst t = st.t === undefined ? 1 : st.t;\nconst sel = st.sel === undefined ? 6 : st.sel;\n"
             "const V = [1520.4, 980.2, 1104.6, 1210.0, 1388.9, 2105.3, 1284.5];\nconst max = 2200;\n"
             "const fmt2 = (v) => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');\n"
             "const P = [\n  { periodo: 'Hoje, 14/11', total: 1284.5, sub: '32 vendas · ticket médio R$ 40,14', bal: 892, onl: 392.5, pix: 590.1, car: 382.4, din: 312, p1: '12 un', p2: '9 un', p3: '3,8 kg' },\n"
             "  { periodo: '08/11 a 14/11', total: 9593.9, sub: '241 vendas · ticket médio R$ 39,81', bal: 6812.4, onl: 2781.5, pix: 4410.2, car: 3201.7, din: 1982, p1: '58 un', p2: '41 un', p3: '19,6 kg' },\n"
             "  { periodo: '01/11 a 14/11', total: 14326.8, sub: '362 vendas · ticket médio R$ 39,58', bal: 10102.3, onl: 4224.5, pix: 6588.9, car: 4790.4, din: 2947.5, p1: '214 un', p2: '77 un', p3: '36,2 kg' }\n];\n"
             "const p = P[t];\nconst out = { semana: t === 1, periodo: p.periodo, total: fmt2(p.total), sub: p.sub, bal: fmt2(p.bal), onl: fmt2(p.onl), pix: fmt2(p.pix), car: fmt2(p.car), din: fmt2(p.din), p1: p.p1, p2: p.p2, p3: p.p3,\n"
             "  sel: ['08/11', '09/11', '10/11', '11/11', '12/11', '13/11', '14/11'][sel] + ' · ' + fmt2(V[sel]) };\n"
             f"V.forEach((v, i) => {{ out['bh' + i] = Math.round(v / max * 140) + 'px'; out['bc' + i] = i === sel ? '{T}' : '{G2}'; out['bl' + i] = fmt2(v); out['pick' + i] = () => this.setState({{ sel: i }}); }});\n"
             "[0, 1, 2].forEach((k) => { out['a' + k] = t === k; out['b' + k] = t === k ? '" + G + "' : '" + W + "'; out['c' + k] = t === k ? '" + W + "' : '" + G + "'; out['t' + k] = () => this.setState({ t: k }); });\nreturn out;\n}")
gphone('Gestao-Relatorio.dc.html', 'Bodeleve — gestão: relatório de vendas', 1320, rel.replace(f'<a href="#" aria-disabled="true" style="display: none">.</a>', ''), logic_rel)

# ---------- Configurações ----------
confs = (bar('Configurações', 'Gestao-Mais.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    + box(rep('A casa', 'Nome, endereço, horários, WhatsApp, logotipo', '', 'Gestao-Estabelecimento.dc.html')
          + rep('Equipe e permissões', '6 pessoas · 5 papéis', '', 'Gestao-Usuarios.dc.html')
          + rep('Loja online', 'Entrega: taxa fixa R$ 8,00 · retirada grátis', '')
          + rep('Formas de pagamento', 'Pix, cartão na entrega, dinheiro', '')
          + rep('Nota fiscal', 'Não configurado · aguardando decisão', '', None, True), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Loja online, pagamentos e nota fiscal dependem de respostas pendentes (Q6 a Q8 e Q12).</div></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(4)}</div>')
gphone('Gestao-Configuracoes.dc.html', 'Bodeleve — gestão: configurações', 700, confs, VAZIO)

# ---------- Estabelecimento ----------
estab = (bar('A casa', 'Gestao-Configuracoes.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; gap: 12px; align-items: center"><div role="img" aria-label="Espaço para o logotipo" style="flex: none; width: 72px; height: 72px; border-radius: 16px; background: {C}; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: {G2}; text-align: center">[LOGO]</div>'
    f'<div style="{SM}">Logotipo oficial ainda não aprovado. Até lá, a marca aparece só como texto.</div></div>'
    + campo('en', 'Nome', 'Bodeleve') + campo('ec', 'CNPJ', '', '[CNPJ]') + campo('ee', 'Endereço', '', '[ENDEREÇO DA LOJA]')
    + campo('ew', 'WhatsApp de atendimento', '', '[WHATSAPP DA LOJA]', 'tel')
    + f'<section style="display: flex; flex-direction: column; gap: 8px"><b>Horário de funcionamento</b>'
    + box(''.join(f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid {LN}; {NUM}"><span>{d}</span><span style="color: {G2}">{h}</span></div>'
                  for d, h in (('Segunda a sexta', '[HORÁRIO]'), ('Sábado', '[HORÁRIO]'), ('Domingo', '[HORÁRIO]'))), 'padding-top: 0; padding-bottom: 0') + '</section>'
    + salvo('Dados da casa salvos.') + '</main>' + rodape(btn_salvar()))
gphone('Gestao-Estabelecimento.dc.html', 'Bodeleve — gestão: a casa', 1060, estab, "renderVals() {\nconst st = this.state || {};\nreturn { salvo: !!st.salvo, salvar: () => this.setState({ salvo: true }) };\n}")

# ---------- Equipe e permissões ----------
USR = [('[NOME DO DONO]', 'Dono', 'Você'), ('Ana', 'Gestora', 'ana@exemplo.com'), ('Júlia', 'Atendente', 'Balcão'), ('Seu Raimundo', 'Produção', 'Cozinha'), ('Carlos', 'Entregador', 'Próprio'), ('Bruno', 'Entregador', 'Próprio')]
ROLES = ['Dono', 'Gestor', 'Atendente', 'Produção', 'Entregador']
MODS = ['Início e relatórios', 'Pedidos', 'PDV (balcão)', 'Estoque', 'Compras', 'Produção', 'Financeiro', 'Entregas', 'Equipe e configurações']
PERM = {  # papel -> conjunto de módulos (índices)
    'Dono': set(range(9)), 'Gestor': {0, 1, 2, 3, 4, 5, 6, 7}, 'Atendente': {1, 2}, 'Produção': {3, 5}, 'Entregador': {7}}
def urow(i):
    n, r, s = USR[i]
    bd = '' if i == len(USR) - 1 else f'border-bottom: 1px solid {LN}; '
    return (f'<div style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 0; {bd}"><span aria-hidden="true" style="flex: none; width: 36px; height: 36px; border-radius: 999px; background: {C}; display: flex; align-items: center; justify-content: center; font-weight: 700">{n[0] if n[0] != "[" else "D"}</span>'
            f'<span style="flex: 1 1 0; min-width: 0"><b>{n}</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{s}</span></span>{tagc(r, G, C)}</div>')
def perm_row(j):
    return (f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid {LN}"><span>{MODS[j]}</span>'
            f'<sc-if value="{H("y" + str(j))}" hint-placeholder-val="{H("true")}"><span style="display: inline-flex; align-items: center; gap: 4px; color: {OK_T}; font-weight: 600; font-size: 14px">{icon("confirmar", 18)}Vê e usa</span></sc-if>'
            f'<sc-if value="{H("n" + str(j))}" hint-placeholder-val="{H("false")}"><span style="color: {G2}; font-size: 14px">Sem acesso</span></sc-if></div>')
usuarios = (bar('Equipe e permissões', 'Gestao-Configuracoes.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    + box(''.join(urow(i) for i in range(len(USR))), 'padding-top: 0; padding-bottom: 0')
    + f'<sc-if value="{H("fechado")}" hint-placeholder-val="{H("true")}"><button type="button" onClick="{H("abrir")}" style="height: 48px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}; width: 100%">Convidar pessoa</button></sc-if>'
    + f'<sc-if value="{H("aberto")}" hint-placeholder-val="{H("false")}"><div style="padding: 16px; border-radius: 12px; background: {TS}; display: flex; flex-direction: column; gap: 12px">'
      + campo('ue', 'E-mail', '', 'nome@exemplo.com', 'email') + sel('ur', 'Papel', ['Atendente', 'Gestor', 'Produção', 'Entregador'])
      + f'<button type="button" onClick="{H("convidar")}" style="height: 48px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}">Enviar convite</button></div></sc-if>'
    + f'<sc-if value="{H("enviado")}" hint-placeholder-val="{H("false")}"><div role="status" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; background: {G}; color: {C}; font-size: 14px; line-height: 20px">{icon("confirmar", 20)}<span>Convite enviado. A pessoa cria a senha pelo link do e-mail.</span></div></sc-if>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("O que cada papel vê")}'
    f'<div role="group" aria-label="Papel" style="display: flex; gap: 8px; flex-wrap: wrap">' + chips(ROLES) + '</div>'
    + box(''.join(perm_row(j) for j in range(len(MODS))), 'padding-top: 0; padding-bottom: 0') + '</section>'
    + f'<div style="{SM}">Papéis fixos nesta versão. Permissão por pessoa fica para depois, se precisar.</div></main>')
logic_usr = ("renderVals() {\nconst st = this.state || {};\nconst t = st.t || 0;\nconst inv = st.inv || 0;\n"
             "const P = [" + ', '.join('[' + ', '.join(str(j) for j in sorted(PERM[r])) + ']' for r in ROLES) + "];\n"
             "const out = { fechado: inv === 0, aberto: inv === 1, enviado: inv === 2, abrir: () => this.setState({ inv: 1 }), convidar: () => this.setState({ inv: 2 }) };\n"
             "for (let j = 0; j < " + str(len(MODS)) + "; j++) { const y = P[t].indexOf(j) >= 0; out['y' + j] = y; out['n' + j] = !y; }\n" + chips_logic(5) + "return out;\n}")
gphone('Gestao-Usuarios.dc.html', 'Bodeleve — gestão: equipe e permissões', 1400, usuarios, logic_usr)
