import {native,treeScene,photoScene} from '../../sequences/narrative/shared.js';
export function photographs(t) {
  return photoScene(t,{tree:treeScene(1600/60),back:native('photoBack'),strings:native('strings')});
}

export const render=photographs;
