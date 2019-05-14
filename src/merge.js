import diffStyles from '@mapbox/mapbox-gl-style-spec/diff';
import { clone } from './utils'

const supportedDiffOperations = [
  'addLayer',
  'addSource',
]

const ignoredDiffOperations = [
  'setCenter',
  'setZoom',
  'setBearing',
  'setPitch',
  'removeLayer',
  'setPaintProperty',
  'setLayoutProperty',
  'setFilter',
  'removeSource',
  'setLayerZoomRange',
  'setLight',
  'setTransition',
  'setGeoJSONSourceData',
  'setGlyphs',
  'setSprite',
]

export function mergeStyles(style1, style2) {

  const style = clone(style1);
  const changes = diffStyles(style, style2)
    .filter(op => ignoredDiffOperations.indexOf(op.command) < 0);

  if (changes.length === 0) {
    return style;
  }

  const unimplementedOps = changes.filter(op => supportedDiffOperations.indexOf(op.command) < 0);
  if (unimplementedOps.length > 0) {
    throw new Error(`Unimplemented: ${unimplementedOps.map(op => op.command).join(', ')}.`);
  }

  const duplicateSourcesId = []
  const operationsImpl = {
    addSource: function(style, id, source, options) {
      if(style.sources[id]) {
        console.warn('Try to add Source with same Id', id)
        duplicateSourcesId.push(id)
        id = `${id}_copy`
      }
      style.sources[id] = source
    },
    addLayer: function(style, layerObject, before, options) {
      if(duplicateSourcesId.indexOf(layerObject.source) >= 0) {
        layerObject.source = `${layerObject.source}_copy`
      }
      style.layers.push(layerObject)
    }
  }

  changes.forEach((op) => {
    operationsImpl[op.command].apply(this, [style, ...op.args]);
  });


  return style;
}

