"""在预乘透明度下采样位移场，避免透明边缘带入杂色。"""
import numpy as np
from PIL import Image
from scipy import ndimage


def premultiplied(image):
    pixels=np.asarray(image,dtype=np.float32)/255
    pixels[:,:,:3]*=pixels[:,:,3:]
    return pixels


def deform_sprite(pixels,field,grid,grid_step=16):
    y,x=grid
    source_x,source_y=x.copy(),y.copy()
    # 在连续位移场内反求采样位置，整图只重采样一次，不拼接裁片。
    for _ in range(3):
        coordinates=np.array([source_y/grid_step,source_x/grid_step])
        shift_x=ndimage.map_coordinates(field[:,:,0],coordinates,order=1,mode='nearest')
        shift_y=ndimage.map_coordinates(field[:,:,1],coordinates,order=1,mode='nearest')
        source_x,source_y=x-shift_x,y-shift_y
    coordinates=np.array([source_y,source_x])
    result=np.stack([ndimage.map_coordinates(pixels[:,:,channel],coordinates,order=1,mode='constant',cval=0) for channel in range(4)],axis=2)
    alpha=result[:,:,3:]
    np.divide(result[:,:,:3],alpha,out=result[:,:,:3],where=alpha>1e-6)
    result[alpha[:,:,0]<=1e-6]=0
    return Image.fromarray(np.uint8(np.clip(np.rint(result*255),0,255)))
