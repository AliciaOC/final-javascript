//--------variables y constantes
const URL_CATEGORIAS="https://fakestoreapi.com/products/categories";
const URL_PRODUCTOS="https://fakestoreapi.com/products";

let categoriasNav = document.getElementById("categorias-nav");
let botonesCategorias = document.getElementsByClassName('categoria-boton');
let formOrden = document.getElementById("form-orden");
let formVistas = document.getElementById("form-vistas");
let productosSection = document.getElementById("productos");
let vista= document.getElementById("vista").value;
let orden= document.getElementById("ordenar").value;
let vistaDetalles=false;

//----------------llamadas a funciones
borrarFiltroCategoria();
cargarCategoriasNav();
cargarProductos();
creacionLikesDislikesObjetos();


//---------------Eventos
document.getElementById('enlace-productos').addEventListener('click', (event)=>{
    event.preventDefault();
    vistaDetalles=false;
    if(comprobarFiltroCategoria()){
        borrarFiltroCategoria();
    }
    productosSection.innerHTML="";
    cargarProductos();
});

//Para cambiar el orden
document.getElementById('ordenar').addEventListener('click',()=>{
    vistaDetalles=false;
    //Primer click para abrir las opciones, no lo tengo en cuenta pero necesito escucharlo para el segundo click
    //Segundo click para cambiar el orden
    document.getElementById('ordenar').addEventListener('click',()=>{
        //Reviso si ha cambiado el orden
        if(orden!=document.getElementById('ordenar').value){
            orden = document.getElementById('ordenar').value;
            productosSection.innerHTML="";
            //miro si ha filtrado por categoria o no
            if(comprobarFiltroCategoria()){
                cargarProductos(comprobarFiltroCategoria());
            }else{
                cargarProductos();
            }
        }
    });
});

//Para cambiar la vista
document.getElementById('vista').addEventListener('click',()=>{
    vistaDetalles=false;
//primer click para abrir las opciones
//al segundo click puede que haya cambiado la vista
    document.getElementById('vista').addEventListener('click',()=>{
        //reviso si ha cambiado la vista
        if(vista!=document.getElementById('vista').value){
            productosSection.innerHTML="";
            vista = document.getElementById('vista').value;
        //miro si ha filtrado por categoria o no
            if(comprobarFiltroCategoria()){
                cargarProductos(comprobarFiltroCategoria());
            }else{
                cargarProductos();
            }
        }
    });
});


//-----------------------funciones

//de la categoría del nav bar de index.html
function cargarCategoriasNav(){
    try{
        fetch(URL_CATEGORIAS)
        .then(response => response.json())
        .then(categorias => {
            // Recorrer cada categoría y crear un boton para cada una
            categorias.forEach(categoria => {
                // Crear un nuevo elemento <button>
                let boton = document.createElement('button');
                boton.classList.add('categoria-boton');
                // Asignar el nombre de la categoría
                boton.innerHTML = categoria;
                // Agregar un evento al botón con click, se ejecuta la funcion cargarProductos con el nombre de la categoría
                boton.addEventListener('click', () => {
                    if(comprobarFiltroCategoria()){
                        borrarFiltroCategoria();
                    }
                    vistaDetalles=false;
                    productosSection.innerHTML="";
                    boton.classList.add('categoria-seleccionada');
                    cargarProductos(boton.innerHTML);
                });
                // Agregar el botón al nav de categorías
                categoriasNav.appendChild(boton);
            });
        })
    }catch(error){
        console.log(error);
        alert('Ha habido un error al cargar las categorías, inténtelo de nuevo más tarde');
    }
}

//funciones de productos
function cargarProductos(categoria=null) {
    // Reviso si los formularios de orden y vista están vacíos para volver a ponerles su contenido. Se vacían cuando se carga la ficha de un producto
    if (formOrden.innerHTML == "") { // Si está vacío, lo relleno
        formOrden.innerHTML = `
        <label for="ordenar">Ordenar por precio:</label>
        <select name="ordenar" id="ordenar">
           <option value="ascendente" selected>Ascendente</option>
           <option value="descendente">Descendente</option>
        </select>`;
    }
    if (formVistas.innerHTML == "") { // Si está vacío, lo relleno
        formVistas.innerHTML = `
        <label for="vista">Vista:</label>
        <select name="vista" id="vista">
           <option value="tabla">Tabla</option>
           <option value="lista">Lista</option>
        </select>`;
    }

        //Ya sí: cargo los productos dependiendo de si hay categoría seleccionada o no
    try{
        if(categoria==null){//Si no se le pasa ninguna categoría, carga todos los productos
            fetch(URL_PRODUCTOS) 
            .then(res=>res.json())
            .then(productos=>mostrarproductos(productos));
        }else{//Si se le pasa una categoría, carga los productos de esa categoría 
            fetch(`${URL_PRODUCTOS}/category/${categoria}`)
            .then(res=>res.json())
            .then(productos=>mostrarproductos(productos));
        } 
    }catch(error){
        console.error(error);
        alert('Ha habido un error al cargar los productos, inténtelo de nuevo más tarde');
    }
}
 
function mostrarproductos(productos) {
    // Ordenar los productos por precio
    if (orden == "ascendente") {
        productos.sort((a, b) => a.price - b.price);
    } else if (orden == "descendente") {
        productos.sort((a, b) => b.price - a.price);
    }

    // Mostrar los productos en la vista seleccionada
    if (vista == "tabla") {
        distribucionTabla(productos);
    } else if (vista == "lista") {
        distribucionLista(productos);
    }
}

function rellenarBotonesProducto(elemento, productoID){
    let numLikes = JSON.parse(localStorage.getItem('likesObjeto')).find(p=>p.id==productoID).numLikes;
    let numDislikes = JSON.parse(localStorage.getItem('dislikesObjeto')).find(p=>p.id==productoID).numDislikes;
    elemento.innerHTML+=                
    `
        <label for='anadir-carrito'>Unidades</label>
        <input type='number' id='unidades${productoID}' name='unidades' min='1' max='10' value='1'>
        <button onclick='anadirCarrito(${productoID})' class="anadir-carrito">Añadir al carrito</button>                    
    `;
    if(formOrden.innerHTML!=""){
        elemento.innerHTML+=`<button onclick='mostrarDetallesProducto(${productoID})' class="detalles-boton">Ver detalles</button>`;
    }
            
    if(esFavorito(productoID)){
        elemento.innerHTML+=`<button onclick='favPulsado(this, ${productoID})' class="favoritos-boton fav">En tu lista de favoritos</button>`;
    }else{
        elemento.innerHTML+=`<button onclick='favPulsado(this, ${productoID})' class="favoritos-boton">Añadir a favoritos</button>`;
    }
    
    //miro si el usuario logueado esta en la lista de likeObjeto para aplicar o no la clase like-pulsado
    let usuarioLogeado = JSON.parse(localStorage.getItem('usuarioLogeado'));
    if(usuarioLogeado){
        if(JSON.parse(localStorage.getItem('dislikesObjeto')).find(p=>p.id==productoID).usuarios.includes(usuarioLogeado.username)){
            elemento.innerHTML+=`<button onclick='likePulsado(this, ${productoID})' class="gusta-boton" disabled>Me gusta (${numLikes})</button>`;
        }else if(JSON.parse(localStorage.getItem('likesObjeto')).find(p=>p.id==productoID).usuarios.includes(usuarioLogeado.username)){
            elemento.innerHTML+=`<button onclick='likePulsado(this, ${productoID})' class="gusta-boton like-pulsado">Me gusta (${numLikes})</button>`;
        }else{
             elemento.innerHTML+=`<button onclick='likePulsado(this, ${productoID})' class="gusta-boton">Me gusta (${numLikes})</button>`;
        }
                
        //miro si el usuario logueado esta en la lista de dislikeObjeto para aplicar o no la clase dislike-pulsado
        if(JSON.parse(localStorage.getItem('likesObjeto')).find(p=>p.id==productoID).usuarios.includes(usuarioLogeado.username)){
            elemento.innerHTML+=`<button onclick='dislikePulsado(this, ${productoID})' class="no-gusta-boton" disabled>No me gusta (${numLikes})</button>`;
        }else if(JSON.parse(localStorage.getItem('dislikesObjeto')).find(p=>p.id==productoID).usuarios.includes(usuarioLogeado.username)){
            elemento.innerHTML+=`<button onclick='dislikePulsado(this, ${productoID})' class="no-gusta-boton dislike-pulsado">No me gusta (${numDislikes})</button>`;
        }else{
            elemento.innerHTML+=`<button onclick='dislikePulsado(this, ${productoID})' class="no-gusta-boton">No me gusta (${numDislikes})</button>`;
        }
    }else{//Si no está logueado las funciones le pedirán iniciar sesión cuando pulse los botones
        elemento.innerHTML+=`
            <button onclick='likePulsado(this, ${productoID})' class="gusta-boton">Me gusta (${numLikes})</button>
            <button onclick='dislikePulsado(this, ${productoID})'class="no-gusta-boton">No me gusta (${numDislikes})</button>
        `;
    }
}

function distribucionTabla(productos) {
    let tabla = productosSection.querySelector('table');
    if (!document.querySelector('table')) {
        tabla = document.createElement('table');
        productosSection.appendChild(tabla);
    }

    let numFilas = Math.ceil(productos.length / 4);
    let contador = 0;

    for (let i = 0; i < numFilas; i++) {
        let fila = document.createElement('tr');
        for (let j = 0; j < 4; j++) {
            //Si no hay más productos, salgo del bucle (en las categorias de electronica y ropa de mujer hace falta)
            if (contador >= productos.length) {
                break;
            }
            let celda = document.createElement('td');
            let producto = productos[contador];
            celda.classList.add('casilla-producto');
            celda.innerHTML = `
                <img src="${producto.image}" alt="${producto.title}">
                <p>${producto.title}</p>
                <p>${producto.price}€</p>
            `;
            rellenarBotonesProducto(celda, producto.id);
            fila.appendChild(celda);
            contador++;
        }
        tabla.appendChild(fila);
    }
}

function distribucionLista(productos) {
    let lista = productosSection.querySelector('ul');
    if (!document.querySelector('ul')) {
        lista = document.createElement('ul');
        productosSection.appendChild(lista);
    }

    productos.forEach(producto => {
        let item = document.createElement('li');
        item.classList.add('casilla-producto');
        item.innerHTML = `
            <img src="${producto.image}" alt="${producto.title}">
            <p>${producto.title}</p>
            <p>${producto.price}€</p>
        `;
        rellenarBotonesProducto(item, producto.id);
        lista.appendChild(item);
    });
}

function mostrarDetallesProducto(id){
    vistaDetalles=true;
    //Vacío el contenido del main
    formOrden.innerHTML="";
    formVistas.innerHTML="";
    productosSection.innerHTML="";
    //Cargo el producto
    try{
        fetch(`${URL_PRODUCTOS}/${id}`)
        .then(res=>res.json())
        .then(producto=>{
            //Creo la estructura de la ficha del producto
            let ficha = document.createElement('article');
            ficha.setAttribute('class','detalles-producto');
            ficha.innerHTML = `
                <img src="${producto.image}" alt="${producto.title}">
                <h2>${producto.title}</h2>
                <p>Categoria: ${producto.category}</p>
                <p>${producto.description}</p>
                <p>${producto.price}€</p>
            `;
            rellenarBotonesProducto(ficha, producto.id);
            productosSection.appendChild(ficha);    
        })
    }catch(error){
        console.error(error);
        alert('Ha habido un error al cargar los detalles del producto, inténtelo de nuevo más tarde');
    }
}
 
function comprobarFiltroCategoria(){
    for (let boton of botonesCategorias) {
        if(boton.classList.contains('categoria-seleccionada')){//contains devuelve true si la clase está en el elemento
            let categoria= boton.innerHTML;
            return categoria;
        }
    }
    return false;
}
 
function borrarFiltroCategoria(){
    for (let boton of botonesCategorias) {
        if(boton.classList.contains('categoria-seleccionada')){
            boton.classList.remove('categoria-seleccionada');
        }
    }
}

//Para añadir productos al carrito
function anadirCarrito(productoID){
    if(localStorage.getItem('usuarioLogeado')!=null){
        let carrito = JSON.parse(localStorage.getItem('carrito'));
        if(carrito==null){
            carrito=[];
        }
        //Primero obtengo las unidades del producto del input que es hermano
        let unidades = parseInt(document.getElementById(`unidades${productoID}`).value);
        //Busco el producto en el array de productos
        fetch(`${URL_PRODUCTOS}/${productoID}`)
        .then(res=>res.json())
        .then(producto=>{
            //Compruebo si ya habia unidades de ese producto en el carrito
            let productoEncontrado = carrito.find(p=>p.id==producto.id);
            if(productoEncontrado!=undefined){
                //Si ya estaba, sumo las unidades
                productoEncontrado.unidades=parseInt(productoEncontrado.unidades);
                productoEncontrado.unidades+=unidades;
                localStorage.setItem('carrito',JSON.stringify(carrito));
                alert('Nuevas unidades del producto añadidas al carrito');
            }else{
                //Si no estaba, añado las unidades al producto
                producto.unidades=unidades;
                //Lo añado al carrito
                carrito.push(producto);
                //Lo guardo en localStorage
                localStorage.setItem('carrito',JSON.stringify(carrito));
                alert('Producto añadido al carrito');
            }
        });        
    }else{
        alert('Primero inicia sesión');
    }
}

function favPulsado(boton, productoID){
    //Por comodidad, voy a eliminar esta clase en todos los botones de favoritos, se la añado cuando corresponda
    if(boton.classList.contains('fav')){
        boton.classList.remove('fav');
    }
    //Compruebo si hay usuario logeado
    let usuarioLogeado = JSON.parse(localStorage.getItem('usuarioLogeado'));
    if(usuarioLogeado){
        //Compruebo si en localstorage hay ya una lista de favoritos
        let favoritos = JSON.parse(localStorage.getItem('favoritos'));
        //Si no hay favotitos creo el array de objetos. Cada objeto es el nombre del usuario y el array de productos favoritos
        if(favoritos==null){
            favoritos=[
                {
                    usuario: usuarioLogeado.username,
                    productos: [productoID]
                }
            ];
            localStorage.setItem('favoritos',JSON.stringify(favoritos));
            boton.innerHTML='En tu lista de favoritos';
            boton.classList.add('fav');
        }else{
            //Compruebo si el usuarioLogueado ya tiene el producto en favoritos
            let objetoUsuarioEncontrado = favoritos.find(f=>f.usuario==usuarioLogeado.username);//Los cambios que haga en objetoUsuarioEncontrado afectan al array original de favoritos
            if(objetoUsuarioEncontrado){
                //Compruebo si el usuario logueado ya tiene ese producto en favoritos
                let posicion = objetoUsuarioEncontrado.productos.indexOf(productoID);//indexOf devuelve la posición de un elemento en un array, si no lo encuentra devuelve -1
                if(posicion>=0){
                    //Si lo tiene lo elimino el producto de favoritos
                    objetoUsuarioEncontrado.productos.splice(posicion,1);//splice elimina un elemento de un array a partir de un índice
                    localStorage.setItem('favoritos',JSON.stringify(favoritos));
                    boton.innerHTML='Añadir a favoritos';
                }else{
                    //Si no lo tiene, lo añado
                    objetoUsuarioEncontrado.productos.push(productoID);
                    localStorage.setItem('favoritos',JSON.stringify(favoritos));
                    boton.innerHTML='En tu lista de favoritos';
                    boton.classList.add('fav');
                }
            }else{//Si no tiene favoritos, añado a favoritos un nuevo objeto con su nombre y el id del producto
                favoritos.push({
                    usuario: usuarioLogeado.username,
                    productos: [productoID]
                });
                localStorage.setItem('favoritos',JSON.stringify(favoritos));
                boton.innerHTML='En tu lista de favoritos';
                boton.classList.add('fav');
            }
        }
    }else{
        alert('Primero inicia sesión');
    }    
}

function esFavorito(productoID){
    let usuarioLogeado = JSON.parse(localStorage.getItem('usuarioLogeado'));
    if(usuarioLogeado){
        let favoritos = JSON.parse(localStorage.getItem('favoritos'));
        if(favoritos){
            let objetoUsuarioEncontrado = favoritos.find(f=>f.usuario==usuarioLogeado.username);
            if(objetoUsuarioEncontrado){
                let posicion = objetoUsuarioEncontrado.productos.indexOf(productoID);
                if(posicion>=0){
                    return true;
                }
            }
        }
    }
    return false;
}

function creacionLikesDislikesObjetos(){
    //Obtengo un array con los id de los productos
    if(!localStorage.getItem('idArrayProductos')){
        let idArrayProductos=[];
        for(let i=1;i<=20;i++){
            idArrayProductos.push(i);
        }
        localStorage.setItem('idArrayProductos',JSON.stringify(idArrayProductos));
        //Creo un array de objetos con los id de los productos y los likes y los usuarios que han dado like
        let likesObjeto = JSON.parse(localStorage.getItem('likesObjeto'));
        if(!likesObjeto|| likesObjeto==null ||likesObjeto.length!=20){
            likesObjeto=[];
            idArrayProductos.forEach(idProducto=>{
                likesObjeto.push({
                    id: idProducto,
                    numLikes: 0,
                    usuarios: []
                });
            });
            localStorage.setItem('likesObjeto',JSON.stringify(likesObjeto));
        }
        //Hago lo mismo con los dislikes
        let dislikesObjeto = JSON.parse(localStorage.getItem('dislikesObjeto'));
        if(!dislikesObjeto || dislikesObjeto==null || dislikesObjeto.length!=20){
            dislikesObjeto=[];
            idArrayProductos.forEach(idProducto=>{
                dislikesObjeto.push({
                id: idProducto,
                numDislikes: 0,
                usuarios: []
                });
            });
            localStorage.setItem('dislikesObjeto',JSON.stringify(dislikesObjeto));
        }
    }
}

function likePulsado(boton, productoID){
    //Borro la clase like-pulsado de todos los botones de like
    if(boton.classList.contains('like-pulsado')){
        boton.classList.remove('like-pulsado');
    }
    //Compruebo si hay usuario logeado
    let usuarioLogeado = JSON.parse(localStorage.getItem('usuarioLogeado'));
    if(usuarioLogeado){
        let likesObjeto = JSON.parse(localStorage.getItem('likesObjeto'));
        if(!likesObjeto || likesObjeto==null || likesObjeto.length!=20){
            creacionLikesDislikesObjetos();
            likesObjeto = JSON.parse(localStorage.getItem('likesObjeto'));
        }
        //Busco el producto en el array de productos
        let productoEncontrado = likesObjeto.find(p=>p.id==productoID);
        //Compruebo si el usuario logueado ya ha dado like a ese producto
        let posicion = productoEncontrado.usuarios.indexOf(usuarioLogeado.username);
        if(posicion>=0){
            //Si ya ha dado like, lo elimino
            productoEncontrado.usuarios.splice(posicion,1);
            productoEncontrado.numLikes--;
            localStorage.setItem('likesObjeto',JSON.stringify(likesObjeto));
            boton.innerHTML=`Me gusta (${productoEncontrado.numLikes})`;
            //activo el borón de dislike que está justo debajo
            boton.nextElementSibling.disabled=false;
        }else{
            //Si no ha dado like, lo añado
            productoEncontrado.usuarios.push(usuarioLogeado.username);
            productoEncontrado.numLikes++;
            localStorage.setItem('likesObjeto',JSON.stringify(likesObjeto));
            boton.innerHTML=`Te gusta (${productoEncontrado.numLikes})`;
            boton.classList.add('like-pulsado');
            //desactivo el botón de dislike que está justo debajo
            boton.nextElementSibling.disabled=true;
        }
    }else{
        alert('Primero inicia sesión');
    }
}

//Función muy parecida a la anterior, pero para los diskes
function dislikePulsado(boton, productoID){
    if(boton.classList.contains('dislike-pulsado')){
        boton.classList.remove('dislike-pulsado');
    }
    //Compruebo si hay usuario logeado
    let usuarioLogeado = JSON.parse(localStorage.getItem('usuarioLogeado'));
    if(usuarioLogeado){
        let dislikesObjeto = JSON.parse(localStorage.getItem('dislikesObjeto'));
        if(!dislikesObjeto || dislikesObjeto==null || dislikesObjeto.length!=20){
            creacionLikesDislikesObjetos();
            dislikesObjeto = JSON.parse(localStorage.getItem('dislikesObjeto'));
        }
        //Busco el producto en el array de productos
        let productoEncontrado = dislikesObjeto.find(p=>p.id==productoID);
        //Compruebo si el usuario logueado ya ha dado dislike a ese producto
        let posicion = productoEncontrado.usuarios.indexOf(usuarioLogeado.username);
        if(posicion>=0){
            //Si ya ha dado dislike, lo elimino
            productoEncontrado.usuarios.splice(posicion,1);
            productoEncontrado.numDislikes--;
            localStorage.setItem('dislikesObjeto',JSON.stringify(dislikesObjeto));
            boton.innerHTML=`No me gusta (${productoEncontrado.numDislikes})`;
            //activo el botón de like que está justo encima
            boton.previousElementSibling.disabled=false;
        }else{
            //Si no ha dado dislike, lo añado
            productoEncontrado.usuarios.push(usuarioLogeado.username);
            productoEncontrado.numDislikes++;
            localStorage.setItem('dislikesObjeto',JSON.stringify(dislikesObjeto));
            boton.innerHTML=`No te gusta (${productoEncontrado.numDislikes})`;
            boton.classList.add('dislike-pulsado');
            //desactivo el botón de like que está justo encima
            boton.previousElementSibling.disabled=true;
        }
    }else{
        alert('Primero inicia sesión');
    }
}
