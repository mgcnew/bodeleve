from b15_pdv import *   # regenera gestão e PDV e traz os auxiliares
import os, json

PERFIL = '"perfil":{"editor":"enum","options":["Próprio","Parceiro"],"default":"Próprio","section":"Protótipo"}'
def ephone(fname, title, h, body, logic, props=''):
    pj = '{' + (props + ',' if props else '') + '"$preview":{"width":390,"height":' + str(h) + '}}'
    html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<title>' + title + '</title>\n<script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n'
            '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">\n'
            '<style>\nbody{margin:0}\na{color:#A9482C}a:hover{color:#8A3920}\n</style>\n</helmet>\n'
            f'<div style="width: 390px; height: {h}px; box-sizing: border-box; display: flex; flex-direction: column; background: {OP}; color: {G}; font-family: {FB}; font-size: 16px; line-height: 24px">\n'
            + body + '\n</div>\n</x-dc>\n'
            "<script type=\"text/x-dc\" data-dc-script data-props='" + pj + "'>\n"
            'class Component extends DCLogic {\n' + logic + '\n}\n</script>\n</body>\n</html>\n')
    open(os.path.join(OUT, fname), 'w').write(html)
    print(fname, len(html))

ENAV = [('entregas', 'Entregas', 'Ent-Lista.dc.html'), ('historico', 'Histórico', 'Ent-Historico.dc.html'), ('perfil', 'Perfil', 'Ent-Perfil.dc.html')]
def enav(active):
    cells = ''
    for i, (ic, t, href) in enumerate(ENAV):
        on = i == active
        cur = 'aria-current="page" ' if on else ''
        cells += (f'<a href="{href}" {cur}style="flex: 1 1 0; min-width: 0; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-decoration: none; '
                  f'color: {T if on else G2}; font-size: 12px; line-height: 16px; font-weight: {700 if on else 500}">{icon(ic)}<span>{t}</span></a>')
    return f'<nav aria-label="Navegação do entregador" style="flex: none; margin-top: auto; display: flex; background: {W}; border-top: 1px solid {LN}">{cells}</nav>'
PER = "const parc = (this.props.perfil ?? 'Próprio') === 'Parceiro';\n"
def etapas_ent(n):
    segs = ''.join(f'<span aria-hidden="true" style="flex: 1 1 0; height: 6px; border-radius: 999px; background: {V if i < n - 1 else T if i == n - 1 else LN}"></span>' for i in range(4))
    nomes = ['Aceite', 'Coleta', 'Em rota', 'Entrega']
    return f'<div style="display: flex; flex-direction: column; gap: 6px"><div style="display: flex; gap: 6px">{segs}</div><div style="{SM}">Etapa {n} de 4 · {nomes[n - 1]}</div></div>'
destino = lambda: (f'<div style="display: flex; gap: 10px; align-items: flex-start">{icon("local", 22, T)}<div><b>Paula Reis</b><div style="{SM}">Rua do Sol, 88 · Bairro Alto</div>'
                   f'<div style="font-size: 13px; line-height: 18px; color: {G2}">Ponto de referência: portão azul</div></div></div>')

# ---------- Entrar ----------
entrar = (f'<main style="flex: 1 1 0; display: flex; flex-direction: column; justify-content: center; gap: 20px; padding: 24px 20px">'
    f'<div><div style="font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px">Bodeleve</div><div style="{SM}">Entregas</div></div>'
    f'<sc-if value="{H("p1")}" hint-placeholder-val="{H("true")}">' + campo('ec', 'Celular', '(00) 90000-0300', '', 'tel') + BIG('Receber código no WhatsApp', H('pedir')) + '</sc-if>'
    f'<sc-if value="{H("p2")}" hint-placeholder-val="{H("false")}"><div style="{SM}">Código enviado para (00) 90000-0300.</div>'
    f'<div role="group" aria-label="Código de 4 dígitos" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">'
    + ''.join(f'<input type="text" inputmode="numeric" maxlength="1" aria-label="Dígito {i + 1}" style="height: 56px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; text-align: center; font: 600 22px {FB}; color: {G}; box-sizing: border-box; width: 100%">' for i in range(4))
    + '</div>' + BIGA('Entrar', 'Ent-Lista.dc.html') + SEC('Usar outro número', H('voltar')) + '</sc-if>'
    f'<div style="{SM}">Só entra quem a casa cadastrou: entregadores próprios e parceiros.</div></main>')
ephone('Ent-Entrar.dc.html', 'Bodeleve — entregas: entrar', 700, entrar,
       "renderVals() {\nconst p = (this.state && this.state.p) || 1;\nreturn { p1: p === 1, p2: p === 2, pedir: () => this.setState({ p: 2 }), voltar: () => this.setState({ p: 1 }) };\n}")

# ---------- Entregas (Disponíveis · Minhas) ----------
def seg2():
    on = f'height: 44px; border: 0; border-radius: 8px; background: {W}; color: {G}; font: 600 15px {FB}; box-shadow: 0 1px 2px rgba(41,38,33,0.12)'
    off = f'height: 44px; border: 0; border-radius: 8px; background: transparent; color: {G2}; font: 600 15px {FB}'
    return (f'<div role="group" aria-label="Lista" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 4px; border-radius: 12px; background: {C}; border: 1px solid {LN}">'
            f'<button type="button" aria-pressed="{H("s0")}" onClick="{H("t0")}" style="{H("st0")}">Disponíveis · 1</button><button type="button" aria-pressed="{H("s1")}" onClick="{H("t1")}" style="{H("st1")}">Minhas · 1</button></div>'), on, off
segm2, ON2, OFF2 = seg2()
lista = (f'<header style="flex: none; padding: 16px 16px 8px; display: flex; justify-content: space-between; align-items: center; gap: 12px"><div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px">Entregas</h1><div style="{SM}">{H("quem")}</div></div>'
    f'{tagc("Disponível", OK_T, OK_B)}</header>'
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 8px 16px 24px">{segm2}'
    f'<sc-if value="{H("s1")}" hint-placeholder-val="{H("true")}"><a href="Ent-Detalhe.dc.html" style="padding: 16px; border-radius: 16px; background: {W}; border: 2px solid {T}; text-decoration: none; color: {G}; display: flex; flex-direction: column; gap: 10px">'
    f'<span style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><b style="font-size: 18px">Pedido #1041</b>{tagc("Para você", IN_T, IN_B)}</span>'
    f'<span style="display: flex; gap: 10px; align-items: flex-start">{icon("local", 20, G2)}<span><b>Bairro Alto</b><span style="display: block; font-size: 14px; line-height: 20px; color: {G2}">Rua do Sol, 88</span></span></span>'
    f'<span style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; {NUM}"><span><span style="display: block; font-size: 12px; color: {G2}">Distância</span><b>4,1 km</b></span>'
    f'<span><span style="display: block; font-size: 12px; color: {G2}">Itens</span><b>6</b></span><span><span style="display: block; font-size: 12px; color: {G2}">{H("valorLbl")}</span><b>{H("valor")}</b></span></span></a></sc-if>'
    f'<sc-if value="{H("s0")}" hint-placeholder-val="{H("false")}"><div style="padding: 16px; border-radius: 16px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 10px">'
    f'<span style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><b style="font-size: 18px">Pedido #1043</b>{tagc("Pronto às 15h40", OK_T, OK_B)}</span>'
    f'<span style="display: flex; gap: 10px; align-items: flex-start">{icon("local", 20, G2)}<span><b>Centro</b><span style="display: block; font-size: 14px; line-height: 20px; color: {G2}">1,8 km · 3 itens</span></span></span>'
    f'<span style="{SM}">{H("dispTxt")}</span>'
    f'<sc-if value="{H("naoPegou")}" hint-placeholder-val="{H("true")}"><button type="button" onClick="{H("pegar")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}; width: 100%">{H("pegarTxt")}</button></sc-if>'
    f'<sc-if value="{H("pegou")}" hint-placeholder-val="{H("false")}"><div role="status" style="display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 12px; background: {OK_B}; color: {OK_T}; font-weight: 600">{icon("confirmar", 20)}<span>É sua. Fica na fila depois do #1041.</span></div></sc-if></div></sc-if>'
    f'<div style="{SM}">{H("regra")}</div></main>' + enav(0))
logic_lista = ("renderVals() {\n" + PER + "const st = this.state || {};\nconst t = st.t === undefined ? 1 : st.t;\n"
               "const on = " + json.dumps(ON2) + ", off = " + json.dumps(OFF2) + ";\n"
               "return { quem: parc ? 'Diego · parceiro' : 'Bruno · entregador da casa', valorLbl: parc ? 'Você recebe' : 'Cobrar', valor: parc ? 'R$ 9,00' : 'Nada', s0: t === 0, s1: t === 1, st0: t === 0 ? on : off, st1: t === 1 ? on : off,\n"
               "  t0: () => this.setState({ t: 0 }), t1: () => this.setState({ t: 1 }), naoPegou: !st.pegou, pegou: !!st.pegou, pegar: () => this.setState({ pegou: true }),\n"
               "  dispTxt: parc ? 'Publicada para parceiros · você recebe R$ 9,00' : 'Ainda sem entregador. Você pode pegar.', pegarTxt: parc ? 'Aceitar por R$ 9,00' : 'Pegar esta entrega',\n"
               "  regra: parc ? 'Como parceiro, você vê só as entregas que a casa publicou e recebe por entrega.' : 'Como entregador da casa, você recebe as entregas que o balcão atribui e pode pegar as que estão livres.' };\n}")
ephone('Ent-Lista.dc.html', 'Bodeleve — entregas: lista', 760, lista, logic_lista, PERFIL)

# ---------- Detalhe e aceite ----------
det = (bar('Pedido #1041', 'Ent-Lista.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">{etapas_ent(1)}'
    + card(f'<div style="{LBL}">Coletar em</div><div style="display: flex; gap: 10px; align-items: flex-start">{icon("inicio", 22, G2)}<div><b>Bodeleve</b><div style="{SM}">[ENDEREÇO DA LOJA] · balcão</div></div></div>')
    + card(f'<div style="{LBL}">Entregar para</div>' + destino())
    + f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">'
    + ''.join(f'<div style="padding: 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}; min-width: 0"><div style="font-size: 12px; line-height: 16px; color: {G2}">{t}</div><div style="font-weight: 700; font-size: 18px; {NUM}">{v}</div></div>'
              for t, v in (('Distância', '4,1 km'), ('Volumes', '1 sacola'), ('Itens', '6'))) + '</div>'
    + f'<div style="padding: 14px 16px; border-radius: 12px; background: {OK_B}; color: {OK_T}; display: flex; gap: 10px; align-items: center; font-weight: 600">{icon("confirmar", 20)}<span>Pago no Pix. Nada a cobrar.</span></div>'
    + f'<sc-if value="{H("parc")}" hint-placeholder-val="{H("false")}"><div style="padding: 14px 16px; border-radius: 12px; background: {TS}; display: flex; justify-content: space-between; font-weight: 600; {NUM}"><span>Você recebe por esta entrega</span><span>R$ 9,00</span></div></sc-if></main>'
    + rodape(f'<sc-if value="{H("antes")}" hint-placeholder-val="{H("true")}">' + BIG(H('aceitarTxt'), H('aceitar')) + '</sc-if>'
             f'<sc-if value="{H("depois")}" hint-placeholder-val="{H("false")}"><div role="status" style="text-align: center; font-weight: 600; color: {OK_T}">Entrega aceita. A loja foi avisada.</div>' + BIGA('Ir para a coleta', 'Ent-Coleta.dc.html') + '</sc-if>'))
logic_det = ("renderVals() {\n" + PER + "const ok = !!(this.state && this.state.ok);\n"
             "return { parc: parc, antes: !ok, depois: ok, aceitarTxt: parc ? 'Aceitar por R$ 9,00' : 'Aceitar entrega', aceitar: () => this.setState({ ok: true }) };\n}")
ephone('Ent-Detalhe.dc.html', 'Bodeleve — entregas: detalhe e aceite', 960, det, logic_det, PERFIL)

# ---------- Coleta ----------
CHK = ['1 sacola térmica, lacrada', 'Nota da casa com o pedido #1041', 'Nada para cobrar (pago no Pix)']
coleta = (bar('Coleta', 'Ent-Detalhe.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">{etapas_ent(2)}'
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Confira antes de sair</div>'
    + box(''.join(f'<label for="ck{i}" style="display: flex; align-items: center; gap: 12px; min-height: 56px; border-bottom: 1px solid {LN}"><input id="ck{i}" type="checkbox" checked="{H("c" + str(i))}" onChange="{H("tg" + str(i))}" style="flex: none; width: 24px; height: 24px; accent-color: {V}; margin: 0"><span>{t}</span></label>'
                  for i, t in enumerate(CHK)), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}">Se faltar algo, avise o balcão antes de sair.</div></main>'
    + rodape(f'<sc-if value="{H("pronto")}" hint-placeholder-val="{H("false")}">' + BIGA('Saí da loja', 'Ent-Rota.dc.html') + '</sc-if>'
             f'<sc-if value="{H("falta")}" hint-placeholder-val="{H("true")}"><button type="button" disabled style="height: 56px; border: 0; border-radius: 12px; background: {LN}; color: {G2}; font: 600 16px {FB}; width: 100%; {NUM}">Confira os itens · {H("n")} de 3</button></sc-if>'))
logic_col = ("renderVals() {\nconst c = (this.state && this.state.c) || [false, false, false];\nconst n = c.filter(Boolean).length;\nconst out = { n: n, pronto: n === 3, falta: n < 3 };\n"
             "c.forEach((v, i) => { out['c' + i] = v; out['tg' + i] = () => { const k = c.slice(); k[i] = !k[i]; this.setState({ c: k }); }; });\nreturn out;\n}")
ephone('Ent-Coleta.dc.html', 'Bodeleve — entregas: coleta', 700, coleta, logic_col)

# ---------- Em rota ----------
rota = (bar('Em rota', 'Ent-Coleta.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">{etapas_ent(3)}'
    f'<div role="img" aria-label="Espaço para o mapa da rota" style="height: 200px; border-radius: 16px; background: {C}; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: {G2}">[MAPA DA ROTA]</div>'
    + card(destino() + f'<div style="display: flex; justify-content: space-between; {NUM}; color: {G2}; font-size: 14px"><span>4,1 km · cerca de 12 min</span><span>Cliente avisada às 15h44</span></div>')
    + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
    + f'<a href="https://www.google.com/maps/search/?api=1&amp;query=Rua%20do%20Sol%2088" style="height: 48px; border-radius: 12px; border: 1.5px solid {G}; color: {G}; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600">{icon("local", 20)}Abrir no mapa</a>'
    + f'<a href="tel:+5500900000002" style="height: 48px; border-radius: 12px; border: 1.5px solid {G}; color: {G}; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600">{icon("perfil", 20)}Ligar</a></div>'
    + f'<div style="{SM}">“Abrir no mapa” usa o app de mapas do celular; nesta versão, sem rastreio em tempo real.</div></main>'
    + rodape(BIGA('Cheguei', 'Ent-Confirmacao.dc.html') + SECA('Problema na entrega', 'Ent-Problema.dc.html')))
ephone('Ent-Rota.dc.html', 'Bodeleve — entregas: em rota', 860, rota, VAZIO)

# ---------- Confirmação por código ----------
conf = (bar('Entregar', 'Ent-Rota.dc.html')
    + f'<sc-if value="{H("antes")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">{etapas_ent(4)}'
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Peça o código à cliente</div>'
    f'<div style="{SM}">Paula recebeu um código de 4 números no WhatsApp e na tela de acompanhamento do pedido.</div>'
    f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="cod" style="font-size: 14px; line-height: 20px; font-weight: 600">Código de entrega</label>'
    f'<input id="cod" type="text" inputmode="numeric" maxlength="4" autocomplete="one-time-code" aria-invalid="{H("erro")}" aria-describedby="codm" onChange="{H("onCod")}" '
    f'style="height: 64px; padding: 0 16px; border-radius: 8px; border: {H("bd")}; background: {W}; color: {G}; font: 700 32px {FB}; letter-spacing: 0.4em; text-align: center; {NUM}; box-sizing: border-box; width: 100%"></div>'
    f'<sc-if value="{H("erro")}" hint-placeholder-val="{H("false")}"><div id="codm" role="alert" style="display: flex; gap: 8px; align-items: center; color: {ER_T}; font-size: 14px; font-weight: 500">{icon("alerta", 18)}Código não confere. Confira com a cliente.</div></sc-if>'
    f'<a href="Ent-Problema.dc.html" style="align-self: flex-start; min-height: 44px; display: inline-flex; align-items: center; font-weight: 600; text-decoration: none">A cliente não tem o código</a></main>'
    + rodape(BIG('Confirmar entrega', H('confirmar'))) + '</sc-if>'
    f'<sc-if value="{H("feito")}" hint-placeholder-val="{H("false")}"><main style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 48px 24px">'
    f'<div aria-hidden="true" style="width: 72px; height: 72px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("confirmar", 36)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 26px; line-height: 32px">Entregue</h1><div style="color: {G2}; {NUM}">Pedido #1041 · 15h58 · a loja e a cliente foram avisadas.</div></main>'
    + rodape(BIGA('Próxima entrega', 'Ent-Lista.dc.html') + SECA('Ver histórico', 'Ent-Historico.dc.html')) + '</sc-if>')
logic_conf = ("renderVals() {\nconst st = this.state || {};\nconst erro = !!st.erro;\n"
              f"return {{ antes: !st.feito, feito: !!st.feito, erro: erro, bd: erro ? '2px solid {ER_T}' : '2px solid {G}', onCod: (e) => this.setState({{ cod: String(e.target.value).trim(), erro: false }}),\n"
              "  confirmar: () => { if (st.cod === '7305') { this.setState({ feito: true, erro: false }); } else { this.setState({ erro: true }); } } };\n}")
ephone('Ent-Confirmacao.dc.html', 'Bodeleve — entregas: confirmar entrega', 760, conf, logic_conf)

# ---------- Problema na entrega ----------
MOT = ['Cliente não atende', 'Endereço não encontrado', 'Cliente recusou o pedido', 'Cliente sem o código', 'Outro']
prob = (bar('Problema na entrega', 'Ent-Rota.dc.html')
    + f'<sc-if value="{H("antes")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    + fieldset('O que aconteceu?', ''.join(radio2(f'm{i}', 'mot', t, '', i == 0) for i, t in enumerate(MOT)))
    + f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="pobs" style="font-size: 14px; line-height: 20px; font-weight: 600">Detalhe (opcional)</label>'
      f'<textarea id="pobs" rows="2" style="padding: 12px 14px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}; resize: vertical"></textarea></div>'
    + f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="pfoto" style="font-size: 14px; line-height: 20px; font-weight: 600">Foto do local (opcional)</label>'
      f'<input id="pfoto" type="file" accept="image/*" capture="environment" style="font: 400 14px {FB}; color: {G2}"></div>'
    + f'<div style="{SM}">A loja recebe o aviso na hora e pode ligar para a cliente.</div></main>'
    + rodape(SECA('Tentar de novo', 'Ent-Rota.dc.html') + BIG('Devolver à loja', H('devolver'))) + '</sc-if>'
    f'<sc-if value="{H("feito")}" hint-placeholder-val="{H("false")}"><main style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 48px 24px">'
    f'<div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {AT_B}; color: {AT_T}; display: flex; align-items: center; justify-content: center">{icon("voltar", 32)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Devolução registrada</h1><div style="color: {G2}">Leve o pedido #1041 de volta à loja e entregue no balcão. A loja foi avisada e decide se reenvia.</div></main>'
    + rodape(BIGA('Voltar às entregas', 'Ent-Lista.dc.html') + SEC('Desfazer', H('desfazer'))) + '</sc-if>')
ephone('Ent-Problema.dc.html', 'Bodeleve — entregas: problema', 980, prob,
       "renderVals() {\nconst f = !!(this.state && this.state.f);\nreturn { antes: !f, feito: f, devolver: () => this.setState({ f: true }), desfazer: () => this.setState({ f: false }) };\n}")

# ---------- Histórico ----------
HIS = [('#1041 · Bairro Alto', '15h58 · 4,1 km', 'Entregue'), ('#1038 · Vila Nova', '13h05 · 2,6 km', 'Entregue'), ('#1035 · Centro', '11h20 · 1,2 km', 'Entregue'), ('#1031 · Jardim das Flores', '10h02 · 3,3 km', 'Devolvido')]
def hrow(i):
    n, s, st = HIS[i]
    bd = '' if i == len(HIS) - 1 else f'border-bottom: 1px solid {LN}; '
    tag = tagc(st, OK_T, OK_B) if st == 'Entregue' else tagc(st, AT_T, AT_B)
    return (f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; {bd}{NUM}"><span style="flex: 1 1 0; min-width: 0"><b>{n}</b><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{s}</span></span>'
            f'<span style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px">{tag}<sc-if value="{H("parc")}" hint-placeholder-val="{H("false")}"><span style="font-weight: 700">{"R$ 9,00" if st == "Entregue" else "R$ 4,50"}</span></sc-if></span></div>')
hist = (f'<header style="flex: none; padding: 16px 16px 8px"><h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px">Histórico</h1><div style="{SM}">Hoje, 14/11</div></header>'
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 8px 16px 24px">'
    f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">'
    + ''.join(f'<div style="padding: 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}; min-width: 0"><div style="font-size: 12px; line-height: 16px; color: {G2}">{t}</div><div style="font-weight: 700; font-size: 18px; {NUM}">{v}</div></div>'
              for t, v in (('Entregas', '3'), ('Devolução', '1'), ('Rodados', '11,2 km'))) + '</div>'
    + box(''.join(hrow(i) for i in range(len(HIS))), 'padding-top: 0; padding-bottom: 0')
    + f'<sc-if value="{H("parc")}" hint-placeholder-val="{H("false")}"><div style="padding: 16px; border-radius: 12px; background: {TS}; display: flex; flex-direction: column; gap: 6px; {NUM}">'
      f'<div style="display: flex; justify-content: space-between; font-weight: 700"><span>A receber hoje</span><span>R$ 31,50</span></div><div style="{SM}">3 entregas × R$ 9,00 + 1 devolução × R$ 4,50. Pago por Pix toda segunda.</div></div></sc-if>'
    + f'<sc-if value="{H("prop")}" hint-placeholder-val="{H("true")}"><div style="{SM}">Entregador da casa: o pagamento é mensal, combinado com a loja. O histórico serve para conferência.</div></sc-if></main>' + enav(1))
ephone('Ent-Historico.dc.html', 'Bodeleve — entregas: histórico', 820, hist, "renderVals() {\n" + PER + "return { parc: parc, prop: !parc };\n}", PERFIL)

# ---------- Perfil ----------
perfil = (f'<header style="flex: none; padding: 16px 16px 8px"><h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px">Perfil</h1></header>'
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 8px 16px 24px">'
    f'<div style="display: flex; gap: 12px; align-items: center"><span aria-hidden="true" style="flex: none; width: 56px; height: 56px; border-radius: 999px; background: {C}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 22px">{H("ini")}</span>'
    f'<div><div style="font-weight: 700; font-size: 20px">{H("nome")}</div><div>{H("tipoTag")}</div></div></div>'
    + box(switch('sd', 'Disponível para entregas', 'Desligue quando parar o turno', 'disp', 't_disp').replace(f'border-bottom: 1px solid {LN}', 'border-bottom: 0', 1), 'padding-top: 0; padding-bottom: 0')
    + card(li('Veículo', 'Moto · [PLACA]') + li('Celular', '(00) 90000-0300') + li('Pagamento', H('pag')))
    + f'<sc-if value="{H("parc")}" hint-placeholder-val="{H("false")}">' + campo('pix', 'Chave Pix para receber', '', '[CHAVE PIX]') + '</sc-if>'
    + f'<a href="Ent-Entrar.dc.html" style="align-self: flex-start; min-height: 44px; display: inline-flex; align-items: center; font-weight: 600; text-decoration: none">Sair</a></main>' + enav(2))
logic_perfil = ("renderVals() {\n" + PER + "const st = this.state || {};\nconst out = { parc: parc, nome: parc ? 'Diego' : 'Bruno', ini: parc ? 'D' : 'B',\n"
                f"  pag: parc ? 'Por entrega, Pix às segundas' : 'Mensal, pela casa' }};\n"
                + switch_logic('disp', True) + "return out;\n}")
perfil = perfil.replace(f'<div>{H("tipoTag")}</div>', f'<div><sc-if value="{H("parc")}" hint-placeholder-val="{H("false")}">{tagc("Parceiro", G, C)}</sc-if><sc-if value="{H("prop")}" hint-placeholder-val="{H("true")}">{tagc("Entregador da casa", OK_T, OK_B)}</sc-if></div>')
logic_perfil = logic_perfil.replace("const out = { parc: parc,", "const out = { parc: parc, prop: !parc,")
ephone('Ent-Perfil.dc.html', 'Bodeleve — entregas: perfil', 760, perfil, logic_perfil, PERFIL)
