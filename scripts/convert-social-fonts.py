#!/usr/bin/env python3
"""One-time font preparation; normal builds use the committed TTF assets.

Requires fonttools[woff]. Derives fixed instances from the existing OFL WOFF2
fonts, retaining their copyright and license metadata with distinct family names.
"""
from pathlib import Path
from shutil import copyfile
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

project = Path(__file__).resolve().parent.parent
output = project / "scripts/assets/fonts"
output.mkdir(parents=True, exist_ok=True)
fonts = [
    ("BricolageGrotesque", "Acho Social Display", "Bold", {"opsz": 72, "wght": 700, "wdth": 100}),
    ("InstrumentSans", "Acho Social Text", "Medium", {"wght": 500, "wdth": 100}),
]
for source, family, style, axes in fonts:
    font = instantiateVariableFont(TTFont(project / f"public/fonts/{source}-Variable.woff2"), axes)
    font.flavor = None
    names = {
        1: family, 2: style, 3: f"acho.lol:{family}:{style}:1.0", 4: f"{family} {style}",
        6: f"{family.replace(' ', '')}-{style}", 16: family, 17: style,
    }
    for name_id, value in names.items():
        font["name"].removeNames(nameID=name_id)
        font["name"].setName(value, name_id, 3, 1, 0x409)
        font["name"].setName(value, name_id, 1, 0, 0)
    font.save(output / f"{family.replace(' ', '')}-{style}.ttf")
    copyfile(project / f"public/fonts/licenses/{source}-OFL.txt", output / f"{source}-OFL.txt")
    print(f"Derived {family} {style} from {source}, axes={axes}")
