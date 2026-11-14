import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'design')
FD = "'Bricolage Grotesque', 'Inter', system-ui, sans-serif"
FB = "'Inter', system-ui, sans-serif"
T = '#A9482C'; TP = '#8A3920'; TS = '#F4E1D8'; V = '#315C46'; M = '#D9A441'; C = '#F7F2E8'; G = '#292621'
G2 = '#5E584E'; LN = '#E4DCCB'; OP = '#FBFAF6'; W = '#FFFFFF'
OK_T, OK_B = '#315C46', '#E3EDE6'
AT_T, AT_B = '#7A5A12', '#F8EBC9'
ER_T, ER_B = '#8C1D18', '#F6E0DC'
IN_T, IN_B = '#2F5D7C', '#DDE8EF'
LBL = f"font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: {G2}"
SM = f"font-size: 14px; line-height: 20px; color: {G2}"

ICONS = {
 'inicio': '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"></path>',
 'buscar': '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>',
 'sacola': '<path d="M6 8h12l1 12H5L6 8z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path>',
 'perfil': '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>',
 'pedidos': '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"></path><path d="M9 8h6"></path><path d="M9 12h6"></path>',
 'estoque': '<path d="M3 8l9-5 9 5v8l-9 5-9-5V8z"></path><path d="M3 8l9 5 9-5"></path><path d="M12 13v8"></path>',
 'financeiro': '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"></path><path d="M3 7V6a2 2 0 0 1 2-2h11"></path><path d="M16 13.5h2"></path>',
 'mais': '<path d="M4 4h6v6H4z"></path><path d="M14 4h6v6h-6z"></path><path d="M4 14h6v6H4z"></path><path d="M14 14h6v6h-6z"></path>',
 'vender': '<path d="M3 12V4h8l10 10-8 8L3 12z"></path><circle cx="7.5" cy="7.5" r="1.2"></circle>',
 'historico': '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
 'caixa': '<path d="M3 6h18v12H3z"></path><circle cx="12" cy="12" r="3"></circle>',
 'entregas': '<path d="M3 7h11v9H3z"></path><path d="M14 10h4l3 3v3h-7"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle>',
 'compras': '<path d="M3 4h2l2.5 11h10L20 7H6.5"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle>',
 'producao': '<path d="M3 21V10l6 4v-4l6 4V5h6v16H3z"></path>',
 'adicionar': '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
 'remover': '<path d="M5 12h14"></path>',
 'avancar': '<path d="M9 5l7 7-7 7"></path>',
 'voltar': '<path d="M15 5l-7 7 7 7"></path>',
 'confirmar': '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
 'fechar': '<path d="M6 6l12 12"></path><path d="M18 6L6 18"></path>',
 'alerta': '<path d="M12 4l9 16H3L12 4z"></path><path d="M12 10v4"></path><path d="M12 17v.5"></path>',
 'validade': '<path d="M4 6h16v14H4z"></path><path d="M4 10h16"></path><path d="M8 3v4"></path><path d="M16 3v4"></path>',
 'local': '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"></path><circle cx="12" cy="10" r="2.5"></circle>',
 'sem-conexao': '<path d="M3 9a14 14 0 0 1 18 0"></path><path d="M6.5 12.5a9 9 0 0 1 11 0"></path><path d="M10 16a4 4 0 0 1 4 0"></path><path d="M4 4l16 16"></path>',
}

def icon(name, size=24, color='currentColor'):
    return (f'<svg aria-hidden="true" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex: none">{ICONS[name]}</svg>')

def sec(title, note, inner, extra=''):
    return (f'<section style="padding: 28px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 20px; min-width: 0; {extra}">'
            f'<div style="display: flex; flex-direction: column; gap: 4px"><h2 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 26px">{title}</h2>'
            f'<div style="{SM}">{note}</div></div>{inner}</section>')

def grid(n, inner, gap=24):
    return f'<div style="display: grid; grid-template-columns: repeat({n}, minmax(0, 1fr)); gap: {gap}px; align-items: start">{inner}</div>'

def col(inner, gap=12, extra=''):
    return f'<div style="display: flex; flex-direction: column; gap: {gap}px; min-width: 0; {extra}">{inner}</div>'

def row(inner, gap=12, extra=''):
    return f'<div style="display: flex; flex-wrap: wrap; gap: {gap}px; align-items: center; {extra}">{inner}</div>'

def lbl(t):
    return f'<div style="{LBL}">{t}</div>'

def tagc(t, fg, bg):
    return f'<span style="padding: 4px 10px; border-radius: 8px; background: {bg}; color: {fg}; font-size: 13px; line-height: 18px; font-weight: 600; white-space: nowrap">{t}</span>'

def seal(t, bg):
    return f'<span style="padding: 3px 10px; border-radius: 999px; background: {bg}; color: {W}; font-size: 12px; line-height: 18px; font-weight: 600; white-space: nowrap">{t}</span>'

def btn(t, kind='p', h=48, extra='', pre=''):
    s = {'p': f'background: {T}; color: {W}; border: 0',
         'pp': f'background: {TP}; color: {W}; border: 0',
         's': f'background: transparent; color: {G}; border: 1.5px solid {G}',
         'q': f'background: transparent; color: {T}; border: 0',
         'd': f'background: {W}; color: {ER_T}; border: 1.5px solid {ER_T}',
         'x': f'background: {LN}; color: {G2}; border: 0'}[kind]
    dis = ' disabled' if kind == 'x' else ''
    return (f'<button type="button"{dis} style="height: {h}px; padding: 0 20px; border-radius: 12px; {s}; font: 600 16px {FB}; '
            f'display: inline-flex; align-items: center; justify-content: center; gap: 8px; {extra}">{pre}{t}</button>')

def page(fname, title, eyebrow, h1, lead, aside, body, w, h):
    html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:#A9482C}}a:hover{{color:#8A3920}}
</style>
</helmet>
<div style="width: {w}px; height: {h}px; box-sizing: border-box; padding: 64px; display: flex; flex-direction: column; gap: 32px; background: {C}; color: {G}; font-family: {FB}; font-size: 16px; line-height: 24px">
<div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 48px">
<div style="display: flex; flex-direction: column; gap: 12px">
<div style="font-size: 14px; line-height: 20px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {T}">{eyebrow}</div>
<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 56px; line-height: 60px; letter-spacing: -0.02em">{h1}</h1>
<p style="margin: 0; max-width: 820px; font-size: 18px; line-height: 28px; color: {G2}">{lead}</p>
</div>
<div style="max-width: 360px; padding: 16px 20px; border: 1px solid {LN}; border-radius: 12px; background: {W}; font-size: 14px; line-height: 20px; color: {G2}">{aside}</div>
</div>
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''
    open(os.path.join(OUT, fname), 'w').write(html)
    print(fname, len(html))
