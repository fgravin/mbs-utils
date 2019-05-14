import {mergeStyles} from '../src/merge'
import {clone} from '../src/utils'
import mbsGeojson from './fixtures/geojson'
import mbsSimple from './fixtures/simple'
import mbsOSM from './fixtures/simple-osm'
import mbsSimpleSources from './fixtures/simple-copy-sources'

describe('Merging sources', () => {

  test('should add new sources if different', () => {
    const mergedStyle = mergeStyles(mbsGeojson, mbsOSM)

    expect(Object.keys(mergedStyle.sources).length).toEqual(Object.keys(mbsGeojson.sources).length + Object.keys(mbsOSM.sources).length)
    expect(mergedStyle.sources).toHaveProperty('osm')
    expect(mergedStyle.sources['osm']).toEqual(mbsGeojson.sources['osm'])
  });

  test('should not merge same source with same id', () => {
    const mergedStyle = mergeStyles(mbsSimple, mbsSimple)
    expect(mergedStyle.sources).toEqual(mbsSimple.sources)
  });

  test('should create a source copy when merging different source with same id', () => {
    const mergedStyle = mergeStyles(mbsSimple, mbsSimpleSources)
    expect(Object.keys(mergedStyle.sources).length).toEqual(Object.keys(mbsSimple.sources).length + 1)
    expect(mergedStyle.sources).toHaveProperty('raster_copy')
    expect(mergedStyle.sources['raster_copy']).toEqual(mbsSimpleSources.sources['raster'])
  });

});

describe('Merging layers', () => {

  test('should add new layers if different', () => {
    const mergedStyle = mergeStyles(mbsGeojson, mbsOSM)

    expect(mergedStyle.layers.length).toEqual(mergedStyle.layers.length + mbsOSM.layers.length)
    expect(mergedStyle.layers).toEqual(expect.arrayContaining(mbsOSM.layers))
  });

  test('should not add new layers if same id and same source', () => {
    const mergedStyle = mergeStyles(mbsSimple, mbsSimple)
    expect(mergedStyle.layers).toEqual(mbsSimple.layers)
  });

  test('should add new layers if same id but not same source', () => {

    const style = clone(mbsOSM)
    style.sources['openstreetmap'] = style.sources['osm']
    delete style.sources['osm']
    style.layers[0].source = 'openstreetmap'

    const mergedStyle = mergeStyles(mbsOSM, style)

    expect(mergedStyle.layers.length).toEqual(mbsOSM.layers.length + style.layers.length)
    expect(mergedStyle.layers).toEqual(expect.arrayContaining(style.layers))
    expect(mergedStyle.layers).toEqual(expect.arrayContaining(mbsOSM.layers))
    expect(mergedStyle.layers.filter(l => l.id == 'osm')).toEqual(mergedStyle.layers)
  });

  test('should add new layers and change source if original source is a copy in the new style', () => {

    const mergedStyle = mergeStyles(mbsSimple, mbsSimpleSources)

    expect(mergedStyle.layers.length).toEqual(mbsSimple.layers.length + mbsSimpleSources.layers.length)
    expect(mergedStyle.layers).toEqual(expect.arrayContaining(mbsSimple.layers))
    expect(mergedStyle.layers.filter(l => l.id == 'raster_layer').length).toEqual(2)
    expect(mergedStyle.layers.filter(l => l.source == 'raster_copy').length).toEqual(1)
  });

});