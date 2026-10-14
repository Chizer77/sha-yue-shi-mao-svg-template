"""从起止表情生成嘴眼同步的局部过渡帧。"""
from pathlib import Path
import json
from PIL import Image
from morph import morph_patches

ROOT=Path(__file__).resolve().parents[2]
FOLDER=ROOT/'assets/characters/protagonist-dark/expressions'


def main():
    layout=json.loads((ROOT/'src/characters/protagonist/expressions.json').read_text(encoding='utf-8'))
    settings=json.loads((ROOT/'src/characters/protagonist/expression-generation.json').read_text(encoding='utf-8'))
    x,y,width,height=layout['patchBox'];box=(x,y,x+width,y+height)
    with Image.open(FOLDER/'input/start.png') as image:first=image.convert('RGBA').crop(box)
    with Image.open(FOLDER/'input/end.png') as image:last=image.convert('RGBA').crop(box)
    FOLDER.mkdir(parents=True,exist_ok=True)
    for index,image in enumerate(morph_patches(first,last,len(layout['files']),settings)):
        target=(ROOT/layout['files'][index]).resolve()
        if not target.is_relative_to(ROOT):raise ValueError('输出位置必须在工程内')
        target.parent.mkdir(parents=True,exist_ok=True);temporary=target.with_suffix('.png.tmp')
        image.save(temporary,format='PNG');temporary.replace(target)
    print(f'表情过渡：{len(layout["files"])}张',flush=True)


if __name__=='__main__':main()
