# Units of measurement for inventory management

UNIT_CATEGORIES = {
    "weight": {
        "name": "Peso",
        "units": [
            {"code": "kg", "name": "Quilograma", "symbol": "kg"},
            {"code": "g", "name": "Grama", "symbol": "g"},
            {"code": "t", "name": "Tonelada", "symbol": "t"},
            {"code": "lb", "name": "Libra", "symbol": "lb"},
            {"code": "oz", "name": "Onça", "symbol": "oz"}
        ]
    },
    "volume": {
        "name": "Volume",
        "units": [
            {"code": "l", "name": "Litro", "symbol": "L"},
            {"code": "ml", "name": "Mililitro", "symbol": "mL"},
            {"code": "gal", "name": "Galão", "symbol": "gal"},
            {"code": "fl_oz", "name": "Onça Fluida", "symbol": "fl oz"},
            {"code": "m3", "name": "Metro Cúbico", "symbol": "m³"}
        ]
    },
    "length": {
        "name": "Comprimento",
        "units": [
            {"code": "m", "name": "Metro", "symbol": "m"},
            {"code": "cm", "name": "Centímetro", "symbol": "cm"},
            {"code": "mm", "name": "Milímetro", "symbol": "mm"},
            {"code": "km", "name": "Quilômetro", "symbol": "km"},
            {"code": "in", "name": "Polegada", "symbol": "in"},
            {"code": "ft", "name": "Pé", "symbol": "ft"}
        ]
    },
    "area": {
        "name": "Área",
        "units": [
            {"code": "m2", "name": "Metro Quadrado", "symbol": "m²"},
            {"code": "cm2", "name": "Centímetro Quadrado", "symbol": "cm²"},
            {"code": "ha", "name": "Hectare", "symbol": "ha"},
            {"code": "acre", "name": "Acre", "symbol": "acre"}
        ]
    },
    "count": {
        "name": "Contagem",
        "units": [
            {"code": "pcs", "name": "Peças", "symbol": "pcs"},
            {"code": "units", "name": "Unidades", "symbol": "un"},
            {"code": "dozen", "name": "Dúzia", "symbol": "dz"},
            {"code": "pair", "name": "Par", "symbol": "par"},
            {"code": "pack", "name": "Pacote", "symbol": "pct"},
            {"code": "box", "name": "Caixa", "symbol": "cx"},
            {"code": "bag", "name": "Saco", "symbol": "saco"},
            {"code": "bottle", "name": "Garrafa", "symbol": "gar"},
            {"code": "can", "name": "Lata", "symbol": "lata"}
        ]
    },
    "time": {
        "name": "Tempo",
        "units": [
            {"code": "hr", "name": "Hora", "symbol": "h"},
            {"code": "min", "name": "Minuto", "symbol": "min"},
            {"code": "day", "name": "Dia", "symbol": "dia"},
            {"code": "week", "name": "Semana", "symbol": "sem"},
            {"code": "month", "name": "Mês", "symbol": "mês"},
            {"code": "year", "name": "Ano", "symbol": "ano"}
        ]
    }
}

def get_all_units():
    """Get all available units of measurement"""
    all_units = []
    for category_key, category_data in UNIT_CATEGORIES.items():
        for unit in category_data["units"]:
            all_units.append({
                "category": category_key,
                "category_name": category_data["name"],
                **unit
            })
    return all_units

def get_units_by_category(category: str):
    """Get units for a specific category"""
    if category in UNIT_CATEGORIES:
        return UNIT_CATEGORIES[category]["units"]
    return []

def get_unit_categories():
    """Get all unit categories"""
    return {
        key: category["name"] 
        for key, category in UNIT_CATEGORIES.items()
    } 