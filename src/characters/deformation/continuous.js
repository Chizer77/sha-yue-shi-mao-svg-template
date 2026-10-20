import { displacedImage } from './image.js';
const data = await fetch(new URL('../protagonist/portrait-deformation.json', import.meta.url)).then(
  (response) => response.json(),
);
export function continuousImage(options) {
  return displacedImage(data.kinds[options.kind], options);
}
