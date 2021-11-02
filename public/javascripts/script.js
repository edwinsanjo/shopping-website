
function addToCart(productId) {
    $.ajax({
        url:'/add-to-cart/'+productId,
        method: "get",
        success: (response) => {
            if(response.status){
                let count = $("#cart-count").html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
            }
        }
    })
}

function add() {

    let count = $("#cart-quantity").html()
                count = parseInt(count) + 1
                $("#cart-quantity").html(count)
}

function substract() {

    let count = $("#cart-quantity").html()
                count = parseInt(count) - 1
                $("#cart-quantity").html(count)
}


function remove(cartId,productId) {
    cartId = cartId.toString()
    alert("Are You Sure")
    productId = productId.toString();
    $.ajax({
        url:"/remove-from-cart",
        method: "post",
        data: {
            cart: cartId,
            product:productId,
        },
        success:(res) => {
            res.status = true
            if(res.status){
                location.reload();
            }
        }
    })
}

function ChangeQuantity(cartId,productId,userId,count,quantity) {
    cartId = cartId.toString()
    productId = productId.toString()
    count = parseInt(count)
    let strCount = parseInt(count)
    userId = userId.toString()
    let Quantity = quantity.toString()
    quantity = parseInt(quantity)
    console.log(cartId,productId,count,userId,quantity)
    $.ajax({
        url:"/change-product-quantitiy",
        method: "post",
        data: {
            user:userId,
            cart:cartId,
            product:productId,
            count:strCount,
            quantity:Quantity
        },
        success:(res) => {
            if(res.removeProduct) {
                alert("product removed from cart")
                location.reload();
            }else {
                console.log(res)
                document.getElementById(productId).innerHTML = quantity+count
                document.getElementById("total").innerHTML=res.total
            }
        }
    })
}
