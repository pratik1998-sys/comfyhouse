const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: 'cr5bfa3us4v9',
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: '3_7IB1d_aCZtu2eaCEaYd2mp5ohmvGPPXZMip9_xbtw',
})

// variables

const cartBtn = document.querySelector('.cart-btn')
const closeCartBtn = document.querySelector('.close-cart')
const clearCartBtn = document.querySelector('.clear-cart')
const cartDom = document.querySelector('.cart')
const cartOverlay = document.querySelector('.cart-overlay')
const cartItems = document.querySelector('.cart-items')
const cartTotal = document.querySelector('.cart-total')
const cartContent = document.querySelector('.cart-content')
const productsDom = document.querySelector('.products-center')

//cart
let cart = []

//Buttons
let ButtonsDOM = []

//getting the products
class Products {
  async getProducts() {
    try {
      // This API call will request an entry with the specified ID from the space defined at the top, using a space-specific access token.
      let contentFull = await client.getEntries({
        content_type: 'comfyHouseProductExample',
      })

      let result = await fetch('products.json')
      let data = await result.json()

      let products = contentFull.items
      products = products.map((item) => {
        const { title, price } = item.fields
        const id = item.sys.id
        const image = item.fields.image.fields.file.url
        return { title, price, id, image }
      })
      return products
    } catch (error) {
      console.log(error)
    }
  }
}

//Display Products
class UI {
  displayProducts(products) {
    //console.log(products)
    let result = ''
    products.forEach((product) => {
      result += `
              <!--single product-->
        <article class="product">
          <div class="img-container">
            <img
              src=${product.image}
              alt="product"
              class="product-img"
            />
            <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i>
              add to bag
            </button>
          </div>
          <h3>${product.title}</h3>
          <h4>$${product.price}</h4>
        </article>
        <!--End of single product-->
      `
    })
    productsDom.innerHTML = result
  }

  getBagButtons() {
    const Buttons = [...document.querySelectorAll('.bag-btn')]
    //  console.log(Buttons)
    ButtonsDOM = Buttons
    Buttons.forEach((button) => {
      let id = button.dataset.id
      let inCart = cart.find((item) => item.id === id)
      if (inCart) {
        button.innerText = 'In Cart'
        button.disabled = true
      }
      button.addEventListener('click', (event) => {
        event.target.innerText = 'In Cart'
        event.target.disabled = true
        //get the product from products
        let cartItem = { ...Storage.getProduct(id), amount: 1 }
        //add product to the cart
        cart = [...cart, cartItem]
        //add product to the local storage
        Storage.saveCart(cart)
        //set cart values
        this.setCartValues(cart)
        //display cart item
        this.addCartItem(cartItem)
        //display cart
        this.showCart()
      })
    })
  }

  setCartValues(cart) {
    let tempTotal = 0
    let itemTotal = 0
    cart.map((item) => {
      tempTotal += item.price * item.amount
      itemTotal += item.amount
    })
    cartTotal.innerHTML = parseFloat(tempTotal.toFixed(2))
    cartItems.innerHTML = itemTotal
  }

  addCartItem(item) {
    const div = document.createElement('div')
    div.classList.add('cart-item')
    div.innerHTML = `<img src=${item.image} alt="product" />
            <div>
              <h4>${item.title}</h4>
              <h5>${item.price}</h5>
              <span class="remove-item" data-id="${item.id}">remove</span>
            </div>
            <div>
              <i class="fas fa-chevron-up" data-id=${item.id}></i>
              <p class="item-amount">${item.amount}</p>
              <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>`
    cartContent.appendChild(div)
  }

  showCart() {
    cartOverlay.classList.add('transparentBcg')
    cartDom.classList.add('showCart')
  }

  hideCart() {
    cartOverlay.classList.remove('transparentBcg')
    cartDom.classList.remove('showCart')
  }

  setupAPP() {
    cart = Storage.getCart()
    this.setCartValues(cart)
    this.populateCart(cart)
    cartBtn.addEventListener('click', this.showCart)
    closeCartBtn.addEventListener('click', this.hideCart)
  }

  populateCart(cart) {
    cart.forEach((item) => this.addCartItem(item))
  }

  cartLogic() {
    //clear cart button
    clearCartBtn.addEventListener('click', () => this.clearCart())

    //cart functionality
    cartContent.addEventListener('click', (event) => {
      if (event.target.classList.contains('remove-item')) {
        let cartItem = event.target
        const id = cartItem.dataset.id
        cartContent.removeChild(cartItem.parentElement.parentElement)
        this.removeItem(id)
      } else if (event.target.classList.contains('fa-chevron-up')) {
        let cartItemId = event.target.dataset.id
        let tempItem = cart.find((item) => item.id === cartItemId)
        tempItem.amount += 1
        Storage.saveCart(cart)
        this.setCartValues(cart)
        event.target.nextElementSibling.innerHTML = tempItem.amount
      } else if (event.target.classList.contains('fa-chevron-down')) {
        let cartItemId = event.target.dataset.id
        let tempItem = cart.find((item) => item.id === cartItemId)
        tempItem.amount -= 1
        if (tempItem.amount > 0) {
          Storage.saveCart(cart)
          this.setCartValues(cart)
          event.target.previousElementSibling.innerHTML = tempItem.amount
        } else {
          this.removeItem(tempItem.id)
          cartContent.removeChild(event.target.parentElement.parentElement)
        }
      }
    })
  }

  clearCart() {
    let cartItems = cart.map((items) => items.id)
    cartItems.forEach((id) => this.removeItem(id))
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0])
    }
    this.hideCart()
  }

  removeItem(id) {
    cart = cart.filter((item) => item.id !== id)
    this.setCartValues(cart)
    Storage.saveCart(cart)
    let button = this.getSingleButton(id)
    button.disabled = false
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>
              add to bag`
  }

  getSingleButton(id) {
    return ButtonsDOM.find((button) => button.dataset.id === id)
  }
}

//local storage
class Storage {
  static saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products))
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem('products'))
    return products.find((product) => product.id === id)
  }

  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart))
  }

  static getCart() {
    return localStorage.getItem('cart')
      ? JSON.parse(localStorage.getItem('cart'))
      : []
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UI()
  const products = new Products()
  //setup App
  ui.setupAPP()
  //getting the products
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products)
      Storage.saveProducts(products)
    })
    .then(() => {
      ui.getBagButtons()
      ui.cartLogic()
    })
})
