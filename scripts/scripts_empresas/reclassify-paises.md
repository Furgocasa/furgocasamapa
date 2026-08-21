# Recategorizar país por país

España y Reino Unido / Gales: **no tocar**.

```
npx ts-node --project tsconfig.scripts.json scripts/scripts_empresas/reclassify-tipos.ts --pais "Portugal"
npx ts-node --project tsconfig.scripts.json scripts/scripts_empresas/reclassify-tipos.ts --pais "Portugal" --apply
```

Revisar `camping→publica` y `privada→publica` antes de aplicar.

| Bloque | País | Estado | Notas |
|--------|------|--------|-------|
| — | España | hecha | no tocar |
| — | Reino Unido | hecha | Gales; no tocar |
| A | Portugal | hecha | 0 cambios (ya alineada) |
| A | Andorra | hecha | 0 cambios |
| A | Luxemburgo | hecha | 1 camperparking → privada |
| A | Eslovenia | hecha | 13 camperstop → privada, 2 camping |
| A | Chequia | hecha | 1 caravan park → camping |
| A | Desconocido | hecha | 2 camping |
| B | Alemania | hecha | 18 camping, 7 privada |
| B | Austria | hecha | 2 camping, 5 heuriger/granja → privada |
| B | Suiza | hecha | 9 camping, 3 bauernhof → privada |
| B | Países Bajos | hecha | 16 camperpark → privada, 9 camping |
| B | Bélgica | hecha | 5 camperpark → privada, 1 camping |
| C | Francia | hecha | 198 camping, 66 Camping-Car Park / privada |
| C | Italia | hecha | 65 camping, 46 camper stop/park → privada |
| D | Noruega | hecha | 55 camping (resto bobilplass sigue publica) |
| D | Dinamarca | hecha | 11 camping, 1 camperstop |
| D | Suecia | hecha | 20 camping |
| E | México | hecha | ya camping/privada; no se aplica (2 vuelcos dudosos) |
| E | Argentina | hecha | 0 cambios |
| E | Chile | hecha | 0 cambios |
| E | Uruguay | hecha | 0 cambios |
| E | Costa Rica | hecha | 0 cambios |
| E | Puerto Rico | hecha | 0 cambios |
| E | Ecuador | hecha | 0 cambios |
| E | Colombia | hecha | 0 cambios |
| E | Panamá | hecha | 0 cambios |
| E | Perú | hecha | 0 cambios |
| E | Paraguay | hecha | 0 cambios |
