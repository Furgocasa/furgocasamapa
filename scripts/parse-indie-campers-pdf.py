#!/usr/bin/env python3
"""
Parsea el PDF/export de flota Indie Campers y genera JSON normalizado.

Uso:
  python scripts/parse-indie-campers-pdf.py "ruta/al/fichero.pdf"
  python scripts/parse-indie-campers-pdf.py   # usa PDF por defecto si existe

Salida:
  scripts/data/indie-campers-fleet.json
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

try:
    import pypdf
except ImportError:
    print("Instala pypdf: pip install pypdf")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts" / "data" / "indie-campers-fleet.json"

DEFAULT_PDF = Path(
    r"c:\Users\NARCISOPARDOBUENDA\AppData\Local\Temp\Copy of Untitled spreadsheet - Sheet1 (22) (4).pdf"
)

# Tras header "Price" o tras un precio "Euro 32,790" viene el VIN (evita comer dígitos del precio)
VIN_SPLIT = re.compile(
    r"(?:Price|Euro\s*\d{1,3}(?:,\d{3})+)([A-HJ-NPR-Z][A-HJ-NPR-Z0-9]{16})"
)
PRICE_TAIL = re.compile(
    r"(20\d{2})\s+(\d+)\s*Euro\s*(\d{1,3}(?:,\d{3})+|\d{4,6})", re.I
)

COUNTRIES = [
    "Germany",
    "Portugal",
    "Italy",
    "Spain",
    "France",
    "Belgium",
    "Netherlands",
    "Austria",
    "Norway",
    "Croatia",
    "Poland",
    "Sweden",
    "Denmark",
    "Switzerland",
    "Ireland",
    "Greece",
    "Finland",
    "Hungary",
    "Romania",
    "Slovenia",
    "United Kingdom",
]

COUNTRY_ES = {
    "Germany": "Alemania",
    "Portugal": "Portugal",
    "Italy": "Italia",
    "Spain": "España",
    "France": "Francia",
    "Belgium": "Bélgica",
    "Netherlands": "Países Bajos",
    "Austria": "Austria",
    "Norway": "Noruega",
    "Croatia": "Croacia",
    "Poland": "Polonia",
    "Sweden": "Suecia",
    "Denmark": "Dinamarca",
    "Switzerland": "Suiza",
    "Ireland": "Irlanda",
    "Greece": "Grecia",
    "Finland": "Finlandia",
    "Hungary": "Hungría",
    "Romania": "Rumanía",
    "Slovenia": "Eslovenia",
    "United Kingdom": "Reino Unido",
}

# IVA estándar por país de matriculación (precios Indie con IVA incluido)
VAT = {
    "Germany": 0.19,
    "Portugal": 0.23,
    "Italy": 0.22,
    "Spain": 0.21,
    "France": 0.20,
    "Belgium": 0.21,
    "Netherlands": 0.21,
    "Austria": 0.20,
    "Norway": 0.25,
    "Croatia": 0.25,
    "Poland": 0.23,
    "Sweden": 0.25,
    "Denmark": 0.25,
    "Switzerland": 0.081,
    "Ireland": 0.23,
    "Greece": 0.24,
    "Finland": 0.255,
    "Hungary": 0.27,
    "Romania": 0.19,
    "Slovenia": 0.22,
    "United Kingdom": 0.20,
}

OEM_BRANDS = (
    r"Weinsberg|Etrusco|Carado|"
    r"VW Grand California|Volkswagen Grand California|"
    r"VW California|Volkswagen California|"
    r"Trigano|Pilote|Hymer|Knaus|Sunlight|Pössl|Poessl|Westfalia|Malibu|"
    r"Globecar|Roadcar|Dreamer|Chausson|Adria|Burstner|Bürstner|Dethleffs|"
    r"Hobby|McLouis|Benimar|Roller Team|Laika|Niesmann|Itineo|Challenger|"
    r"Autostar|Giottiline|Crosscamp|Mercedes-Benz|Mercedes Marco Polo|Mercedes"
)
CHASSIS_BRANDS = (
    r"FIAT|FORD|PEUGEOT|CITROEN|CITROËN|VW|VOLKSWAGEN|MERCEDES|RENAULT|OPEL|MAN|IVECO"
)


def normalize_chasis(raw: str | None) -> str | None:
    if not raw:
        return None
    u = raw.upper()
    if u.startswith("FIAT"):
        return "Fiat Ducato"
    if u.startswith("FORD"):
        return "Ford Transit"
    if u.startswith("PEUGEOT"):
        return "Peugeot Boxer"
    if u.startswith("CITRO"):
        return "Citroën Jumper"
    if u.startswith("VW") or u.startswith("VOLKSWAGEN"):
        return "VW"
    if u.startswith("MERCEDES"):
        return "Mercedes"
    if u.startswith("RENAULT"):
        return "Renault Master"
    if u.startswith("IVECO"):
        return "Iveco Daily"
    return raw.split()[0].title()


def parse_oem_block(mid: str):
    brand_m = re.search(rf"({OEM_BRANDS})", mid, re.I)
    if not brand_m:
        brand_m = re.search(
            r"(Grand California|California Ocean|California Beach)", mid, re.I
        )
        if not brand_m:
            return None, None, None, None
        rest = mid[brand_m.start() :]
        ch = re.search(rf"({CHASSIS_BRANDS})", rest, re.I)
        if ch:
            modelo = rest[: ch.start()].strip()
            chassis_full = rest[ch.start() :].strip()
        else:
            modelo = re.split(r"(manual|automatic)", rest, flags=re.I)[0].strip()
            chassis_full = "VW Grand California"
        modelo = re.sub(
            r"\s*(Manual|Auto|LHD|RHD).*$", "", modelo, flags=re.I
        ).strip()
        return (
            "VW",
            modelo or "Grand California",
            normalize_chasis(chassis_full),
            chassis_full,
        )

    after = mid[brand_m.start() :]
    oem_token = brand_m.group(1)
    # Buscar chasis DESPUÉS del nombre OEM (evita que "VW" de "VW Grand California" sea chasis)
    rest_after_oem = after[len(oem_token) :]
    ch = re.search(rf"({CHASSIS_BRANDS})", rest_after_oem, re.I)
    if ch:
        oem = (oem_token + rest_after_oem[: ch.start()]).strip()
        chassis_full = rest_after_oem[ch.start() :].strip()
        chassis_full = re.sub(
            r"\s*(Manual|Auto)\s*(LHD|RHD)?\s*$", "", chassis_full, flags=re.I
        ).strip()
    else:
        oem = re.split(r"(manual|automatic)", after, flags=re.I)[0].strip()
        chassis_full = None

    oem_l = oem.lower()
    token_l = oem_token.lower()
    if "grand california" in oem_l or token_l.startswith("vw grand"):
        marca = "VW"
        modelo = "Grand California"
        if not chassis_full:
            chassis_full = "VW Grand California"
    elif "california" in oem_l or token_l.startswith("vw california"):
        marca = "VW"
        # Conservar variante si aparece (Coast, Ocean, Beach…)
        variante = re.search(
            r"California(?:\s+T[\d.]+)?(?:\s+(Coast|Ocean|Beach|Ocean|Surf))?",
            oem,
            re.I,
        )
        modelo = "California"
        if variante and variante.group(1):
            modelo = f"California {variante.group(1).title()}"
        # Intentar T6.1 Coast del chassis duplicado
        t_var = re.search(
            r"California\s+(T[\d.]+(?:\s+\w+)?)", chassis_full or oem, re.I
        )
        if t_var:
            modelo = f"California {t_var.group(1).strip()}"
        if not chassis_full:
            chassis_full = "VW"
    elif "marco polo" in oem_l or "marco polo" in token_l or token_l.startswith(
        "mercedes"
    ):
        marca = "Mercedes"
        modelo = "Marco Polo" if "marco polo" in oem_l or "marco polo" in token_l else (
            re.sub(r"^(Mercedes-Benz|Mercedes)\s*", "", oem, flags=re.I).strip()
            or "Marco Polo"
        )
        if not chassis_full:
            chassis_full = "Mercedes"
    else:
        parts = oem.split()
        if not parts:
            return None, None, None, None
        marca = parts[0]
        modelo = " ".join(parts[1:])

    modelo = re.sub(r"\s+", " ", (modelo or "")).strip()
    return marca, modelo or None, normalize_chasis(chassis_full), chassis_full


def parse_pdf(pdf_path: Path) -> list[dict]:
    reader = pypdf.PdfReader(str(pdf_path))
    full = "".join((p.extract_text() or "") for p in reader.pages)

    vin_matches = list(VIN_SPLIT.finditer(full))
    records: list[dict] = []
    errors: list[dict] = []

    for i, m in enumerate(vin_matches):
        vin = m.group(1)
        start = m.end()
        end = (
            vin_matches[i + 1].start(1) if i + 1 < len(vin_matches) else len(full)
        )
        chunk = full[start:end]
        pm = PRICE_TAIL.search(chunk)
        if not pm:
            errors.append({"vin": vin, "err": "no_price", "chunk": chunk[:160]})
            continue

        year = int(pm.group(1))
        kms = int(pm.group(2))
        price = int(pm.group(3).replace(",", ""))
        before = chunk[: pm.start()]

        country = None
        cidx = -1
        for c in COUNTRIES:
            idx = before.rfind(c)
            if idx > cidx:
                cidx = idx
                country = c

        mid = before[:cidx] if country else before
        mid = re.sub(r"(manual|automatic)\s*$", "", mid, flags=re.I).strip()
        mid_clean = re.sub(r"(LHD|RHD)\s*(manual|automatic)?", "", mid, flags=re.I)

        marca, modelo, chasis, chassis_full = parse_oem_block(
            mid_clean if mid_clean.strip() else mid
        )

        loc = ""
        if country:
            tm = re.search(r"(manual|automatic)\s*(.+)$", before[:cidx], re.I)
            if tm:
                loc = tm.group(2).strip()

        vat = VAT.get(country or "", 0.21)
        neto = round(price / (1 + vat))

        records.append(
            {
                "vin": vin,
                "marca": marca,
                "modelo": modelo,
                "chasis": chasis,
                "chassis_full": chassis_full,
                "año": year,
                "kilometros": kms,
                "precio_bruto": price,
                "precio_neto": neto,
                "iva_pct": round(vat * 100, 1),
                "pais_en": country,
                "pais": COUNTRY_ES.get(country or "", country),
                "ubicacion": loc,
            }
        )

    if errors:
        print(f"[warn] Filas sin precio parseable: {len(errors)}")
        for e in errors[:5]:
            print("   ", e)

    return records


def main() -> None:
    pdf = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF
    if not pdf.exists():
        print(f"[error] PDF no encontrado: {pdf}")
        sys.exit(1)

    print(f"[parse] {pdf}")
    records = parse_pdf(pdf)
    if not records:
        print("[error] No se extrajo ningun registro")
        sys.exit(1)

    # Deduplicar por VIN (conservar el primero)
    seen = set()
    unique = []
    for r in records:
        if r["vin"] in seen:
            continue
        seen.add(r["vin"])
        unique.append(r)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(unique, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[ok] {len(unique)} vehiculos -> {OUT}")
    print("Paises:", dict(Counter(x["pais"] for x in unique)))
    print("Marcas:", Counter(x["marca"] for x in unique).most_common(12))
    print("Anios:", sorted(Counter(x["año"] for x in unique).items()))
    print("Chasis:", dict(Counter(x["chasis"] for x in unique)))
    print(
        "Bruto EUR:",
        min(x["precio_bruto"] for x in unique),
        "-",
        max(x["precio_bruto"] for x in unique),
    )
    print(
        "Neto EUR:",
        min(x["precio_neto"] for x in unique),
        "-",
        max(x["precio_neto"] for x in unique),
    )
    print("Sin marca:", sum(1 for x in unique if not x["marca"]))
    print("Km=0:", sum(1 for x in unique if x["kilometros"] == 0))


if __name__ == "__main__":
    main()
