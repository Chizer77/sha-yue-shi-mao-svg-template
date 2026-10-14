"""同步对齐眼睑与嘴形，避免过渡时出现双眼线或叠嘴。"""
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage


def morph_patches(first, second, count, settings):
    a, b = np.array(first), np.array(second)
    ga, gb = [cv2.cvtColor(im[:, :, :3], cv2.COLOR_RGB2GRAY) for im in [a, b]]
    ab = cv2.calcOpticalFlowFarneback(ga, gb, None, .5, 4, 25, 5, 7, 1.5, 0)
    ba = cv2.calcOpticalFlowFarneback(gb, ga, None, .5, 4, 25, 5, 7, 1.5, 0)
    y, x = np.indices(ga.shape, dtype=np.float32)
    for index in range(count):
        fraction = index/(count-1)
        wa = cv2.remap(a, x-fraction*ab[:, :, 0], y-fraction*ab[:, :, 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        wb = cv2.remap(b, x-(1-fraction)*ba[:, :, 0], y-(1-fraction)*ba[:, :, 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        mixed = wa*(1-fraction)+wb*fraction
        for bounds in settings['eyeBoxes']:
            mixed = align_eyelid(a, b, mixed, bounds, fraction)
        # 眼部光流止于鼻子上方，嘴部使用独立几何对齐，但共用同一过渡进度。
        edge = np.minimum.reduce([x, y, ga.shape[1]-1-x, ga.shape[0]-1-y])/settings['patchFeather']
        window = np.clip(edge, 0, 1)*np.clip((settings['eyeFadeStart']-y)/settings['eyeFadeHeight'], 0, 1)
        mixed = a*(1-window[:, :, None])+mixed*window[:, :, None]
        left, top, right, bottom = settings['mouthBox']
        mixed[top:bottom, left:right] = morph_mouth(a[top:bottom, left:right], b[top:bottom, left:right], fraction)
        yield Image.fromarray(np.round(mixed).astype(np.uint8))


def mouth_sprite(pixels):
    rgb = pixels[:, :, :3].astype(float)
    ink = ((rgb[:, :, 0] > rgb[:, :, 1]*1.15) & (rgb[:, :, 1] < 180)).astype(np.uint8)*255
    mask = cv2.dilate(ink, np.ones((3, 3), dtype=np.uint8))
    rows, columns = np.where(mask)
    bounds = np.array([columns.min(), rows.min(), columns.max()+1, rows.max()+1])
    left, top, right, bottom = bounds
    sprite = pixels[top:bottom, left:right].copy()
    sprite[:, :, 3] = mask[top:bottom, left:right]
    return sprite, bounds, mask


def morph_mouth(first, second, fraction):
    if fraction == 0:
        return first
    if fraction == 1:
        return second
    first_sprite, first_box, first_mask = mouth_sprite(first)
    last_sprite, last_box, last_mask = mouth_sprite(second)
    clean = first.copy()
    clean[:, :, :3] = cv2.inpaint(clean[:, :, :3], np.maximum(first_mask, last_mask), 3, cv2.INPAINT_TELEA)
    # 上下唇分别向目标笑线收拢，避免仅缩放外框后仍叠出一个三角嘴和一条笑线。
    geometry = mouth_geometry(first_sprite, last_sprite, first_box, last_box, clean.shape, fraction)
    candidates = [place_mouth(clean, sprite, geometry) for sprite in [first_sprite, last_sprite]]
    return candidates[0]*(1-fraction)+candidates[1]*fraction


def lip_edges(sprite, horizontal):
    mask = sprite[:, :, 3] > 0
    upper = mask.argmax(axis=0)
    lower = mask.shape[0]-1-mask[::-1].argmax(axis=0)
    positions = np.linspace(0, 1, mask.shape[1])
    return [np.interp(horizontal, positions, edge) for edge in (upper, lower)]


def mouth_geometry(first, last, first_box, last_box, shape, fraction):
    y, x = np.indices((shape[0]*4, shape[1]*4), dtype=np.float32)/4
    box = first_box*(1-fraction)+last_box*fraction
    horizontal = (x-box[0])/max(box[2]-box[0]-1, 1)
    first_edges, last_edges = lip_edges(first, horizontal), lip_edges(last, horizontal)
    upper, lower = [(a+first_box[1])*(1-fraction)+(b+last_box[1])*fraction
                    for a, b in zip(first_edges, last_edges)]
    vertical = (y-upper)/np.maximum(lower-upper, 1)
    active = (horizontal >= 0) & (horizontal <= 1) & (vertical >= 0) & (vertical <= 1)
    return horizontal, vertical, active


def place_mouth(background, sprite, geometry):
    horizontal, vertical, active = geometry
    upper, lower = lip_edges(sprite, horizontal)
    source_x = (horizontal*(sprite.shape[1]-1)).astype(np.float32)
    source_y = (upper+vertical*(lower-upper)).astype(np.float32)
    overlay = cv2.remap(sprite, source_x, source_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    alpha = overlay[:, :, 3:4].astype(float)/255*active[:, :, None]
    result = cv2.resize(background, (overlay.shape[1], overlay.shape[0]), interpolation=cv2.INTER_CUBIC).astype(float)
    result[:, :, :3] = result[:, :, :3]*(1-alpha)+overlay[:, :, :3]*alpha
    return cv2.resize(result, (background.shape[1], background.shape[0]), interpolation=cv2.INTER_AREA)


def eyelid_contour(pixels):
    ink = (pixels[:, :, 0] < 125) & (pixels[:, :, 1] < 115) & (pixels[:, :, 2] < 120)
    labels, _ = ndimage.label(ink)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    ink = sizes[labels] >= 60
    present = ink.any(axis=0)
    columns = np.arange(pixels.shape[1])
    top = ink.argmax(axis=0).astype(float)
    top = np.interp(columns, columns[present], top[present])
    return ndimage.gaussian_filter1d(top, 1), present


def warp_eyelid(pixels, source, target):
    y, x = np.indices(pixels.shape[:2], dtype=np.float32)
    bottom = pixels.shape[0]-1
    # 两张图先对齐到同一条中间眼线，再混合，防止旧眼线与新眼线形成双影。
    mapped = np.where(y <= target, y*source/np.maximum(target, 1),
                      source+(y-target)*(bottom-source)/np.maximum(bottom-target, 1))
    return cv2.remap(pixels, x, mapped.astype(np.float32), cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_REPLICATE).astype(float)


def align_eyelid(a, b, result, bounds, fraction):
    left, top, right, bottom = bounds
    aa, bb = a[top:bottom, left:right], b[top:bottom, left:right]
    first, valid_a = eyelid_contour(aa)
    last, valid_b = eyelid_contour(bb)
    target = first*(1-fraction)+last*fraction
    eye = warp_eyelid(aa, first, target)*(1-fraction)+warp_eyelid(bb, last, target)*fraction
    y, x = np.indices(aa.shape[:2], dtype=np.float32)
    edge = np.clip(np.minimum(x, aa.shape[1]-1-x)/8, 0, 1)
    edge *= np.clip(np.minimum(y, aa.shape[0]-1-y)/8, 0, 1)
    edge *= ndimage.gaussian_filter1d((valid_a | valid_b).astype(float), 1)[None, :]
    # 眼线以下交还双向光流对齐的瞳孔，避免整眼纵向映射拉出两份高光。
    transition = np.clip((y-target-6)/10, 0, 1)
    edge *= 1-transition*transition*(3-2*transition)
    # 最后一帧直接等于目标图，不再保留原睁眼瞳孔上方的旧眼皮。
    if fraction in (0, 1):
        eye = aa if fraction == 0 else bb
        edge = np.ones_like(edge)
    result[top:bottom, left:right] = result[top:bottom, left:right]*(1-edge[:, :, None])+eye*edge[:, :, None]
    return result


