"""从三张基础表情和完整位移场重建深色服装对话帧。"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from deformation import premultiplied,deform_sprite

ROOT=Path(__file__).resolve().parents[2]
FOLDER=ROOT/'assets/characters/protagonist-dark/dialogue'


def load_artworks():
    artworks={}
    for name in ['open','closed-mouth','closed-eyes']:
        with Image.open(FOLDER/'input'/f'{name}.png') as image:
            if image.size!=(1024,1536):raise ValueError(f'{name}输入图需要1024×1536画布')
            artworks[name]=premultiplied(image.convert('RGBA'))
    return artworks


def main():
    sequence=json.loads((ROOT/'src/characters/protagonist/dialogue-dark.json').read_text(encoding='utf-8'))
    deformation=json.loads((ROOT/'src/characters/protagonist/dialogue-dark-deformation.json').read_text(encoding='utf-8'))
    fields={item['frame']:item['field'] for item in deformation['frames']}
    artworks=load_artworks();grid=np.indices((sequence['height'],sequence['width']),dtype=np.float32)
    FOLDER.mkdir(parents=True,exist_ok=True)
    for index,state in enumerate(sequence['frames']):
        expression='closed-eyes' if state['eyes']=='closed' else 'closed-mouth' if state['mouth']=='closed' else 'open'
        field=np.asarray(fields[state['frame']],dtype=np.float32).reshape(deformation['rows']+1,deformation['columns']+1,2)
        result=deform_sprite(artworks[expression],field,grid,deformation['gridStep'])
        target=FOLDER/f'frame-{index:03d}.png';temporary=target.with_suffix('.png.tmp')
        result.save(temporary,format='PNG');temporary.replace(target)
        if (index+1)%30==0 or index==len(sequence['frames'])-1:print(f'深色对话：{index+1}/{len(sequence["frames"])}',flush=True)


if __name__=='__main__':main()
