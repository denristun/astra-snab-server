

const groupBy = (key: any) => (array: any)  =>
  array.reduce((objectsByKeyValue: any, obj: any) => {
    const value = obj[key]
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj)
   
    return objectsByKeyValue
  }, {});









export const groupByRequest = groupBy('request')
