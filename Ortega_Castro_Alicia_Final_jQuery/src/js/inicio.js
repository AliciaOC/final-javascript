//------------------------Variables
const URL_RAZAS_DATOS='https://catfact.ninja/breeds';

let orden=$('#ordenar').val();
let vista=$('#vista').val();
let parrafoRecargar=$('<p>').text('Ha habido un error con la obtención de información, por favor recargue la página o inténtelo más tarde.').attr('id', 'recargar');

//------------------------Eventos
//Evento para el cambio de orden
$('#ordenar').change(function(){
    orden=$(this).val();
    mostrarRazas();
});

//Evento para el cambio de vista
$('#vista').change(function(){
    vista=$(this).val();
    mostrarRazas();
});

//Evento para enlace-inicio
$('#enlace-inicio').click(function(event){
    event.preventDefault();
    mostrarRazas();
});

// -----------------------Llamadas a las funciones
// Voy a guardar la información que necesito para el inicio (razas, id razas y foto) en localStorage en 'gatos'. LocalStorage es más rápido que hacer llamadas AJAX y así no tengo que estar pendiente de la asincronía
$(document).ready(function() {
    //Creo un gif de cargando y lo oculto
    let sectionCargando=$('<section>').attr('id', 'cargando');
    let gifCargando=$('<img>').attr('src', 'img/cargando.gif').attr('alt', 'Cargando');
    sectionCargando.append(gifCargando);
    sectionCargando.hide();
    $('main').append(sectionCargando);

    //Compruebo si ya tengo las razas en localStorage para ahorrar tiempo
    if (localStorage.getItem('gatos') === null) {
        //Espero para que se vea el gift de cargando, así es menos invasivo 
        setTimeout(() => {
            $('#cargando').show();
        }, 500);

        obtenerRazas();
    } else {
        mostrarRazas();
    }
});

// --------------------Funciones---------------------
//------------------------------------------------------------------funciones que interactúan con la API
async function obtenerRazas() {
    let razasArray = [];
    let razas1 = [];
    let razas2 = [];

    // Primera solicitud AJAX
    let solicitud1 = $.ajax({
        url: URL_RAZAS_DATOS + '?limit=98',
        type: 'GET',
        success: function (respuesta) {
            respuesta.data.forEach(dato => {
                if (dato.breed && !razas1.some(r => r.raza === dato.breed)) {//.some devuelve true si encuentra un elemento que cumple la condición, aquí si ya existe la raza no la añado
                    razas1.push({
                        raza: dato.breed,
                        pais: dato.country,
                        origen: dato.origin,
                        pelo: dato.coat,
                        patron: dato.pattern
                    });
                }
            });
        },
        error: function (error) {
            console.error(error);
            $('#contenidoSection').append(parrafoRecargar);
        }
    });

    // Segunda solicitud AJAX
    let solicitud2 = $.ajax({
        url: 'https://api.thecatapi.com/v1/breeds?limit=67',
        type: 'GET',
        success: function (respuesta) {
            respuesta.forEach(dato => {
                if (dato.name && !razas2.some(r => r.raza === dato.name)) {
                    razas2.push({
                        raza: dato.name,
                        id: dato.id
                    });
                }
            });
        },
        error: function (error) {
            console.error(error);
            $('#contenidoSection').append(parrafoRecargar);
        }
    });

    // Esperar a que ambas solicitudes finalicen
    $.when(solicitud1, solicitud2).done(function () {
        razas1.forEach(raza1 => {
            let raza2 = razas2.find(raza2 => raza2.raza === raza1.raza);
            if (raza2) {
                razasArray.push({
                    raza: raza2.raza,
                    id: raza2.id,
                    pais: raza1.pais,
                    origen: raza1.origen,
                    pelo: raza1.pelo,
                    patron: raza1.patron,
                    likes: 0,
                    dislikes: 0
                });
            }
        });
        obtenerImagenes(razasArray);
    });
}


// Función para obtener las imágenes
async function obtenerImagenes(razas) {
    let solicitudes = razas.map(raza => {
        let url = `https://api.thecatapi.com/v1/images/search?limit=3&breed_ids=${raza.id}&api_key=live_vIcm09jTwDDE89WlD2S9JAEn5wz1laQkoJuiuHGcvAUTc3noy8MwpyhL0m6oBpDO`;
        return $.ajax({//el return aquí es necesario para que se guarde la promesa en el array solicitudes, no termina la función
            url: url,
            type: 'GET',
            success: function (respuesta) {
                raza.imagenes = respuesta.map(imagen => imagen.url);
            },
            error: function (error) {
                console.error(error);
                $('#contenidoSection').append(parrafoRecargar);
            }
        });
    });

    Promise.all(solicitudes).then(() => {
        localStorage.setItem('gatos', JSON.stringify(razas));
        $('#cargando').hide();
        mostrarRazas();
    });
}
async function obtenerFacts(){//Esta se usa en mostrar detalles
    const FACTS = "https://catfact.ninja/facts?max_length=300&limit=20";
    let facts = [];
    await $.ajax({
        url: FACTS,
        type: 'GET',
        success: function (respuesta) {
            respuesta.data.forEach(dato => {
                facts.push(dato.fact);
            });
        },
        error: function (error) {
            console.error(error);
            alert('Para obtener un dato aleatorio sobre gatos, recarga la página');
        }
    });
    return facts;
}
//------------------------------------------------------------------fin funciones que interactúan con la API
//funciones para mostrar los gatos e interactuar
function mostrarRazas() {
    //Reviso si los formularios estan ocultos y los hago visibles. Los oculto con toggle en mostrarDetalles
    $('#form-orden').show();
    $('#form-vistas').show();

    //Como aquí existen los formularios, según el valor de orden y vista se mostrarán los gatos
    //Aquí existe 'gatos' y contiene toda la información. Fuera de la función no es seguro que exista o que esté completo, así que inicializo aquí
    let gatos = JSON.parse(localStorage.getItem('gatos')) || [];
    //orden
    if (orden === "ascendente") {
        gatos.sort((a, b) => a.raza.localeCompare(b.raza));//localeCompare compara cadenas de texto
    } else if (orden === "descendente") {
        gatos.sort((a, b) => b.raza.localeCompare(a.raza));
    }
    //vista
    if (vista === "tabla") {
        distribucionTabla(gatos);
    } else if (vista === "lista") {
        distribucionLista(gatos);
    }
}

//lo necesito en tabla, lista y en detalles
function rellenarBotonesFicha(elemento, gato) {
    let numLikes = gato.likes;
    let numDislikes = gato.dislikes;
 
    // Botón detalles
    //verifico que no esté form-orden oculto, para que no salga el botón detalles en detalles
    if ($('#form-orden').is(':visible')) {
        let botonDetalles = $('<button>').text('Ver detalles').addClass('detalles-boton').attr('value', gato.raza);
        botonDetalles.click(function() {
            mostrarDetalles(gato.raza);
        });
        elemento.append(botonDetalles);
    }
     
    // Botón favoritos
    let botonFav = $('<button>').attr('value', gato.raza).addClass('favoritos-boton');
    if (esFavorito(gato.raza)) {//esto es necesario para la primera carga
        botonFav.addClass('fav').text('En tu lista de favoritos');
    } else {
        botonFav.text('Añadir a favoritos');
    }

    botonFav.click(function() {
        favPulsado(botonFav, gato.raza);
    });

    elemento.append(botonFav);
    
    // Botones like y dislike
    //like
    let botonLike = $('<button>').attr('value', gato.raza).addClass('like-boton').text(`Me gusta (${numLikes})`);
    if (tieneDislike(gato.raza)) {
        //desactivo el botón like si ya le ha dado dislike
        botonLike.attr('disabled', true);
    }else if (tieneLike(gato.raza)) {
        botonLike.addClass('like-pulsado').text(`Ya te gusta (${numLikes})`);
    }
    botonLike.click(function() {
        likePulsado(botonLike, gato.raza);
    });
    elemento.append(botonLike);

    //dislike
    let botonDislike = $('<button>').attr('value', gato.raza).addClass('dislike-boton').text(`No me gusta (${numDislikes})`);
    if (tieneLike(gato.raza)) {
        //desactivo el botón dislike si ya le ha dado like
        botonDislike.attr('disabled', true);
    }else if (tieneDislike(gato.raza)) {
        botonDislike.addClass('dislike-pulsado').text(`Ya no te gusta (${numDislikes})`);
    }
    botonDislike.click(function() {
        dislikePulsado(botonDislike, gato.raza);
    });
    elemento.append(botonDislike);
}


function distribucionTabla(gatos) {
    $('#contenidoSection').empty();//Vacío el contenido para que no se acumule

    let tabla = $('#tablaGatos');
    if (tabla.length===0) {
        tabla = $('<table></table>').attr('id', 'tablaGatos');        
        $('#contenidoSection').append(tabla);
    }

    let numFilas = Math.ceil(gatos.length / 4);
    let contador = 0;//Para recorrer el array de gatos

    for (let i = 0; i < numFilas; i++) {
        let fila = $('<tr></tr>');
        for (let j = 0; j < 4; j++) {
            //Si no hay más gatos, salgo del bucle
            if (contador >= gatos.length) {
                break;
            }
            let celda = $('<td></td>');
            let gato = gatos[contador];
            celda.attr('class', 'casilla-gato')
            let contenidoCelda = `
                <h3>${gato.raza}</h3>
                <img src="${gato.imagenes[0]}" alt="${gato.raza}">
            `;
            celda.html(contenidoCelda);
            rellenarBotonesFicha(celda, gato);
            fila.append(celda);
            contador++;
        }
        tabla.append(fila);
    }
}

function distribucionLista(gatos) {
    $('#contenidoSection').empty();//Vacío el contenido para que no se acumule
    let lista = $('#listaGatos');
    if (lista.length===0) {
        lista = $('<ul></ul>').attr('id', 'listaGatos');
        $('#contenidoSection').append(lista);
    }

    gatos.forEach(gato => {
        let item = $('<li></li>').attr('class', 'casilla-gato');
        let contenidoItem = `
                <h3>${gato.raza}</h3>
                <img src="${gato.imagenes[0]}" alt="${gato.raza}">
            `;
        item.html(contenidoItem);
        rellenarBotonesFicha(item, gato);
        lista.append(item);
    });
}

function favPulsado(boton, gatoRaza) {
    let usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (usuarioLogueado) {
        let favoritos = usuarioLogueado.favoritos || [];
        let gato = favoritos.find(g => g.raza === gatoRaza);
        if (gato) {//si ya estaba en favoritos, lo quito
            favoritos = favoritos.filter(g => g.raza !== gatoRaza);
            boton.removeClass('fav');
            boton.text('Añadir a favoritos');
        } else {//si no estaba en favoritos, lo añado
            favoritos.push({ raza: gatoRaza });
            boton.addClass('fav');
            boton.text('En tu lista de favoritos');
        }
        //Guardo los cambios en el usuario logueado y en el localstorage de usuarios
        usuarioLogueado.favoritos = favoritos;
        localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioLogueado));

        let usuarios = JSON.parse(localStorage.getItem('usuarios'));
        let usuario = usuarios.find(u => u.nombreUsuario === usuarioLogueado.nombreUsuario);
        usuario.favoritos = favoritos;
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    } else {
        alert('Debes iniciar sesión para añadir a favoritos');
    }
}


function esFavorito(gatoRaza) {
    let usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (usuarioLogueado) {
        let favoritos = usuarioLogueado.favoritos || [];
        if (favoritos.find(g => g.raza === gatoRaza)) {
            return true;
        }
    }
    return false;
}

function tieneLike(gatoRaza) {
    let usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (usuarioLogueado) {
        let likes = usuarioLogueado.likes || [];
        if (likes.find(g => g.raza === gatoRaza)) {
            return true;
        }
    }
    return false;
}

function tieneDislike(gatoRaza) {
    let usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (usuarioLogueado) {
        let dislikes = usuarioLogueado.dislikes || [];
        if (dislikes.find(g => g.raza === gatoRaza)) {
            return true;
        }
    }
    return false;
}

function likePulsado(boton, gatoRaza){
    //compruebo que haya un usuario logueado
    let usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (usuarioLogueado) {
        //Compruebo si ya le había dado like
        let usuarioLikes = usuarioLogueado.likes || [];
        let gatoEncontrado = usuarioLikes.find(g => g.raza === gatoRaza);//en el array de likes del usuario logueado
        
        let gatos = JSON.parse(localStorage.getItem('gatos'));
        let gato = gatos.find(g => g.raza === gatoRaza);//en el array de gatos

        if (gatoEncontrado) {
            //Si ya le había dado like, lo quito de la lista 
            usuarioLikes = usuarioLikes.filter(g => g.raza !== gatoRaza);
            //le quito un like al gato
            gato.likes--;
            //cambios estéticos
            boton.removeClass('like-pulsado');
            boton.text(`Me gusta (${gato.likes})`);
            //habilito el botón hermano siguiente
            boton.next().attr('disabled', false);
        }else{
            //Si no le había dado like, lo añado a la lista
            usuarioLikes.push({raza: gatoRaza});
            gato.likes++;
            boton.addClass('like-pulsado');
            boton.text(`Ya te gusta (${gato.likes})`);
            boton.next().attr('disabled', true);
        }
        //Guardo los cambios en usuarioLogueado, en la lista de usuarios y en la lista de gatos
        //logueado
        usuarioLogueado.likes = usuarioLikes;
        localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioLogueado));
        //usuarios
        let usuarios = JSON.parse(localStorage.getItem('usuarios'));
        let usuario = usuarios.find(u => u.nombreUsuario === usuarioLogueado.nombreUsuario);
        usuario.likes = usuarioLikes;
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        //gatos
        localStorage.setItem('gatos', JSON.stringify(gatos));
    } else {
        alert('Debes iniciar sesión para dar like');
    }
}

function dislikePulsado(boton, gatoRaza){
    //compruebo que haya un usuario logueado
    let usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));
    if (usuarioLogueado) {
        //Compruebo si ya le había dado dislike
        let usuarioDislikes = usuarioLogueado.dislikes || [];
        let gatoEncontrado = usuarioDislikes.find(g => g.raza === gatoRaza);//en el array de dislikes del usuario logueado
        
        let gatos = JSON.parse(localStorage.getItem('gatos'));
        let gato = gatos.find(g => g.raza === gatoRaza);//en el array de gatos

        if (gatoEncontrado) {
            //Si ya le había dado dislike, lo quito de la lista 
            usuarioDislikes = usuarioDislikes.filter(g => g.raza !== gatoRaza);
            gato.dislikes--;
            boton.removeClass('dislike-pulsado');
            boton.text(`No me gusta (${gato.dislikes})`);
            //habilito el botón hermano anterior
            boton.prev().attr('disabled', false);
        }else{
            //Si no le había dado dislike, lo añado a la lista
            usuarioDislikes.push({raza: gatoRaza});
            gato.dislikes++;
            boton.addClass('dislike-pulsado');
            boton.text(`Ya no te gusta (${gato.dislikes})`);
            boton.prev().attr('disabled', true);
        }
        //Guardo los cambios en usuarioLogueado, en la lista de usuarios y en la lista de gatos
        //logueado
        usuarioLogueado.dislikes = usuarioDislikes;
        localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioLogueado));
        //usuarios
        let usuarios = JSON.parse(localStorage.getItem('usuarios'));
        let usuario = usuarios.find(u => u.nombreUsuario === usuarioLogueado.nombreUsuario);
        usuario.dislikes = usuarioDislikes;
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        //gatos
        localStorage.setItem('gatos', JSON.stringify(gatos));
    } else {
        alert('Debes iniciar sesión para dar dislike');
    }
}

function mostrarDetalles(raza) {
    //Limpio el contenido del main
    $('#form-orden').toggle();
    $('#form-vistas').toggle();
    $('#contenidoSection').empty();
    //obtengo el gato
    let gatos = JSON.parse(localStorage.getItem('gatos'));
    let gato = gatos.find(g => g.raza === raza);
    //Creo el contenedor
    let contenedorDetalles = $('<article>').attr('id', 'contenedorDetalles');
    let contenedorImagenes = $('<div>').attr('id', 'contenedorImagenes');
    //Creo el contenido
    let titulo = $('<h2>').text(gato.raza);
    //saco las imágenes y las meto en su contenedor
    gato.imagenes.forEach(imagen => {
        let img = $('<img>').attr('src', imagen).attr('alt', gato.raza);
        contenedorImagenes.append(img);
    });
    //Creo los botones
    let cajaBotones = $('<div>').attr('id', 'cajaBotones');
    let botones = rellenarBotonesFicha(contenedorDetalles, gato);
    cajaBotones.append(botones);
    //Añado un párrafo que contendrá un dato aleatorio sobre gatos
    let parrafoFacts = $('<p>').attr('id', 'fact');
    obtenerFacts().then(facts => {
        let random = Math.floor(Math.random() * facts.length);
        parrafoFacts.text('Dato aleatorío interesante: '+facts[random]);
    });
    //Añado una lista con las características de la raza
    let lista = $('<ul>');
    let caracteristicas = ['País de origen: ' + gato.pais, 'Origen: ' + gato.origen, 'Pelo: ' + gato.pelo, 'Patrón: ' + gato.patron];
    caracteristicas.forEach(caracteristica => {
        let item = $('<li>').text(caracteristica);
        lista.append(item);
    });

    //Añado el contenido al contenedor
    contenedorDetalles.append(titulo);
    contenedorDetalles.append(parrafoFacts);
    contenedorDetalles.append(contenedorImagenes);
    contenedorDetalles.append(cajaBotones);
    contenedorDetalles.append(lista);
    //Añado el contenedor a la sección
    $('#contenidoSection').append(contenedorDetalles);
}


