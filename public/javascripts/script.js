
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

