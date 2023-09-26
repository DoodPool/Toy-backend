import fs from 'fs'
import { utilService } from './util.service.js'

let gToys = utilService.readJsonFile('data/toy.json')
const PAGE_SIZE = 4

export const toyService = {
  query,
  get,
  remove,
  save,
}

function query(filterBy = {}, sortBy) {
  if (!filterBy) return Promise.resolve(gToys)

  let toysToDisplay = gToys
  if (filterBy.name) {
    const regExp = new RegExp(filterBy.name, 'i')
    toysToDisplay = toysToDisplay.filter((toy) => regExp.test(toy.name))
  }

  if (filterBy.inStock) {
    if (filterBy.inStock === 'false') {
      toysToDisplay = toysToDisplay.filter(toy => toy.inStock === false)
    } else {
      toysToDisplay = toysToDisplay.filter(toy => toy.inStock === true)
    }
  }

  if (filterBy.labels && filterBy.labels.length > 0 && filterBy.labels[0] !== 'All') {
    toysToDisplay = toysToDisplay.filter(toy => {
      return toy.labels.some(label => filterBy.labels.includes(label))
    })
  }

  toysToDisplay = getSortedToys(toysToDisplay, sortBy)
  if (filterBy.pageIdx !== undefined) {
    const startIdx = filterBy.pageIdx * PAGE_SIZE
    toysToDisplay = toysToDisplay.slice(startIdx, PAGE_SIZE + startIdx)
  }

  return Promise.resolve(toysToDisplay)
}

function get(toyId) {
  const toy = gToys.find((toy) => toy._id === toyId)
  if (!toy) return Promise.reject('toy not found!')

  return Promise.resolve(toy)
}

// function remove(toyId, loggedinUser) {
function remove(toyId) {

  const idx = gToys.findIndex(toy => toy._id === toyId)
  // if (idx === -1) return Promise.reject('No Such toy')

  // const toy = toys[idx]
  // if (!loggedinUser.isAdmin &&
  //   toy.owner._id !== loggedinUser._id) {
  //   return Promise.reject('Not your toy')
  // }

  gToys.splice(idx, 1)
  _saveToysToFile()
  return Promise.resolve()
}

function save(toy, loggedinUser) {
  if (toy._id) {
    const toyToUpdate = gToys.find((currToy) => currToy._id === toy._id)
    // if (toy.owner._id !== loggedinUser._id) return Promise.reject('Not your toy')
    toyToUpdate.name = toy.name
    toyToUpdate.price = toy.price
    toyToUpdate.inStock = toy.inStock
    toyToUpdate.labels = toy.labels
  } else {
    toy.createdAt = new Date(Date.now())
    toy._id = utilService.makeId()
    toy.owner = loggedinUser.owner
    gToys.push(toy)
  }

  _saveToysToFile()
  return Promise.resolve(toy)
}

function getSortedToys(toysToDisplay, sortBy) {
  if (sortBy.type === 'name') {
    toysToDisplay.sort((b1, b2) => {
      const title1 = b1.name.toLowerCase()
      const title2 = b2.name.toLowerCase()
      return sortBy.desc * title2.localeCompare(title1)
    })
  } else {
    toysToDisplay.sort(
      (b1, b2) => sortBy.desc * (b2[sortBy.type] - b1[sortBy.type])
    )
  }
  return toysToDisplay
}

function _saveToysToFile() {
  fs.writeFileSync('data/toy.json', JSON.stringify(gToys, null, 2));
}
