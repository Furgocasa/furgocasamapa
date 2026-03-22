# Reglas y Buenas Prácticas para Maquetación de Emails en Mapa Furgocasa

Para garantizar que los emails se visualicen perfectamente en **todos los clientes de correo** (especialmente en el problemático Outlook de escritorio) y mantengan una versión **responsive impecable en móviles** (Gmail app, Apple Mail, etc.), todos los nuevos correos deben cumplir estrictamente las siguientes reglas.

## 1. Estructura Base: Tablas, no Divs
Los clientes de correo antiguos no entienden flexbox, grid, ni propiedades de posicionamiento modernas.
- **Toda la estructura debe hacerse usando `<table border="0" cellpadding="0" cellspacing="0">`**.
- Nunca usar `<div>` para estructurar columnas o contenedores principales.
- La tabla contenedora principal (el fondo gris/color fuera del correo) debe tener `width="100%"`.
- La tabla de contenido real (el cuerpo blanco del correo) debe tener un ancho fijo, comúnmente `max-width: 600px;`.

## 2. El "Fantasma" de Outlook (MSO Conditional Comments)
Outlook para Windows usa el motor de renderizado de Microsoft Word, que ignora el `max-width` y estira las tablas al 100% de la pantalla si no se le dice lo contrario. 
- **SIEMPRE** envuelve el contenedor de 600px con estos comentarios condicionales:

```html
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f4f6f9">
    <tr>
        <td align="center" style="padding: 40px 10px;">
            <!--[if mso]>
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width:600px; background-color:#ffffff; border-radius: 16px;">
            <tr>
            <td style="padding:0;">
            <![endif]-->

            <!-- AQUÍ VA TU TABLA PRINCIPAL DE MAX-WIDTH 600px -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                ...
            </table>

            <!--[if mso]>
            </td>
            </tr>
            </table>
            <![endif]-->
        </td>
    </tr>
</table>
```

## 3. Padding y Márgenes (El problema del desbordamiento en móvil)
- **Evitar combinar `width: 100%` con `padding` en CSS**. En algunos clientes de móvil, ignoran `box-sizing: border-box`, por lo que un div/table al 100% + 20px de padding resultará en un ancho del 110%, provocando scroll horizontal.
- **Solución:** Dar el padding a la celda `<td>` contenedora y meter dentro una tabla al `width="100%"`. La tabla interna ocupará el ancho disponible restante.
- **No usar `margin` para separar elementos**. Usa `<td style="padding-bottom: 20px;">` o filas vacías/imágenes espaciadoras de 1px. Outlook ignora los márgenes en muchos casos.

## 4. Estilos en Línea (Inline CSS)
- Aunque Gmail ya soporta la etiqueta `<style>` en el `<head>`, muchos otros clientes (webmails antiguos de empresas, Outlook) lo eliminan.
- **Regla de oro:** Todos los estilos críticos (fuentes, tamaños, colores, alineaciones, negritas) deben ir directamente en el atributo `style="..."` de la etiqueta.
- La etiqueta `<style>` del `<head>` se reserva exclusivamente para las **Media Queries** (versión móvil).

## 5. Colores de Fondo y Degradados
- **Degradados (`linear-gradient`)** no funcionan en Outlook de escritorio. 
- Si usas un fondo en CSS (`background-color`), **SIEMPRE** pon su equivalente en HTML nativo con el atributo `bgcolor`.
- *Ejemplo correcto:* `<td bgcolor="#0b3c74" style="background-color: #0b3c74;">`

## 6. Botones y CTA (Call to Actions)
Para que un botón sea grande, cliqueable en toda su área y no se rompa en Outlook:
1. Crea una tabla anidada.
2. Dale color de fondo (`bgcolor`) a la celda `<td>`.
3. Dale el padding dentro de la etiqueta `<a>` haciéndola `display: block;`.

```html
<table cellpadding="0" cellspacing="0" border="0" align="center">
    <tr>
        <td align="center" bgcolor="#22c55e" style="background-color: #22c55e; border-radius: 8px;">
            <a href="https://..." style="display: block; padding: 18px 30px; color: #ffffff; font-size: 18px; font-weight: 700; text-decoration: none; border-radius: 8px;">
                ⚡ Probar el Nuevo Mapa
            </a>
        </td>
    </tr>
</table>
```
*(Nota: Outlook ignorará el border-radius, viendo el botón cuadrado, pero funcionará perfectamente. Es degradación elegante).*

## 7. Columnas Responsivas en Móvil
Si tienes un diseño de 2 o 3 columnas en PC que deben apilarse una encima de la otra en móvil:
1. Usa tablas como columnas dentro de una fila `<tr>` asegurándote de usar `valign="top"`.
2. Asigna una clase a la celda contenedora de la columna (ej. `class="col-50"` o `class="col-33"`).
3. En la Media Query del head, haz que esas celdas pasen a ser bloques completos:
```css
@media only screen and (max-width: 600px) {
    .col-50, .col-33 {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        padding-bottom: 15px !important; /* Espacio al apilarse */
    }
}
```

## 8. Imágenes
- Siempre incluir `border: 0;` en el estilo para que en clientes antiguos no salga un borde azul si es un enlace.
- Siempre añadir `display: block;` si no quieres que quede un pequeño espacio blanco indeseado por debajo de la imagen.
- Establecer ancho explícito y usar `height: auto`.
- `style="max-width: 100%; height: auto; display: block; border: 0;"`

## 9. Tipografía
- No asumas que Google Fonts (Web Fonts) funcionarán en todos lados (Outlook las sustituye dolorosamente por Times New Roman).
- Usa una pila de fuentes seguras en tus estilos en línea:
  `font-family: Arial, Helvetica, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;`

## Resumen del Workflow al crear un nuevo email
1. Copia y pega la estructura de un email ya corregido (ej. `51_email-recordatorio-mejora-mapa.html`).
2. Mantén las envolturas condicionales para Microsoft (Outlook).
3. Escribe el nuevo contenido reemplazando textos.
4. Si necesitas una nueva "caja" o separador, copia una tabla entera ya existente y modifica su `bgcolor` o paddings.
5. Evita usar código moderno de CSS que se salga del estándar de la vieja escuela (HTML 4).