// Variables y recursos importados:
var socket = io()




var username = ""

messages = {}

messages.group = {
   list: [],
   unread: 0
}

var userList = []

var currentChat = 'group'



// Interacciones de Usuario


$('#welcome-screen form').submit(function(){


   var new_username = $('#username').val()

   if( new_username != "" ) {

      // almacenarlo en una variable global para uso futuro
      username = new_username

      // notificar al servidor de cambio de nombr ede usuario
      socket.emit('set username', username)

      $('#header-username').html( username )


      // ocultar pantalla de bienvenida
      $('#welcome-screen').animate({
         opacity: 0
      }, 1000, function(){

         $('#welcome-screen').css({
            display: 'none'
         })

         var elementsToShow = $('#main-header, #main-container, #user-actions')

         // hacer transparentes para que al mostrarlos no se vean de golpe
         elementsToShow.css({
            opacity:0,
            display: 'block'
         })

         elementsToShow.animate({
            opacity: 1
         }, 1000)


      })

      // mostrar componentes ocultos

   }

   return false

});

$('#user-actions form').submit(function(e){

   // e.preventDefault()

   // leer valor de input en una variable
   var message = $('#message').val();

   // mandar mensaje dependiendo si el chat actual es grupal, o privado
   if( currentChat == 'group' ) {
      socket.emit('chat message', message )
   }
   else {


      socket.emit('private message', {
         target_id: currentChat,
         message: message
      })

      if( typeof( messages[currentChat] ) === "undefined" ) {
         messages[currentChat] = {
            list: [],
            unread: 0
         }
      }

      messages[currentChat].list.push({
         username: username,
         message: message
      })

      showMessages( messages[currentChat].list )

   }


   // vaciar valor de input
   $('#message').val('')

   return false

});




$('#boton-chat-grupal').click(function(){

   loadGroupChat()

})

// Preparar botones para abrir chat privado:

function setupUserButtons() {

   // deshabilitar click para no duplicar funciones
   $('#users li').unbind('click')

   // configurar click para todos los lis
   $('#users li').click(function(){

      userId = $(this).data('id')

      // $('#users li').attr('selected',false)

      $(this).attr('selected',true)
      // quitar atributo a li's hermanos
      .siblings().attr('selected',false)

      selectUser( userId )

   })
}



// Escuchando mensajes de Socket.io

socket.on('chat message', function( object ){

   // almacenar nuevo mensaje en lista grupal
   messages.group.list.push( object )

   if( currentChat == 'group') {
      showMessages( messages.group.list )
   }

})



socket.on('new user', function(msg){

   showNewMessage( msg.message, 'new-user' );

   // El servidor entrega una lista de TODOS los usuarios conectado
   userList = msg.data

   showActiveUsers( msg.data )

})


socket.on('private message', function( object ){

   sourceUser = object.source_id

   // verificar si existe conversación con el usuario

   if( typeof( messages[sourceUser] ) === "undefined" ) {

      // si no, crearla

      messages[sourceUser] = {
         list: [],
         unread: 0
      }

   }
   // almacenar nuevo mensaje
   messages[sourceUser].list.push( object )

   // aumentar cuenta de msjs sin leer
   messages[sourceUser].unread++

   // si tenemos abierta la conversación con el usuario,
   // mostrar los mensajes en la pantalla
   if( currentChat === object.source_id ) {
      showMessages( messages[ sourceUser ].list )
      messages[ sourceUser ].unread=0
   }

   updateUnreadNumber( sourceUser )

})


socket.on('user gone', function(msg){

   showNewMessage( msg.message, 'user-gone' );

   showActiveUsers( msg.data )

})




/******************* Funciones de  lógica y visualización: **************/


function clearMessages() {
   $('#messages').html('')
}



function formatMessage( object ) {

   formattedMessage = '<a href="/user" class="username" target="_blank">'
   formattedMessage += object.username + ':'
   formattedMessage += '</a>'

   formattedMessage += '<span class="message">'
   formattedMessage += object.message
   formattedMessage += '</span>'

   return formattedMessage

}



function loadConversation( userId ) {

   clearMessages()

   currentChat = userId

   showMessages( messages[userId].list )

   console.log( "cargar conversacion con: ", userId )

}


function loadGroupChat() {

   currentChat = 'group'

   messages.group.unread = 0

   showMessages( messages.group.list )

}


function selectUser( userId ) {

   loadConversation( userId )

   messages[ userId ].unread = 0

   updateUnreadNumber( userId )


   // tomar el li del usuario seleccionado, activarlo


}



function showActiveUsers( users ) {

   // vaciar espacio para llenar con usuarios:
   $('#users').html('');

   for( i in users ) {
      //crear nuevo elemento li con jquery
      newElement = $('<li>')

      userSpan = $('<span>').addClass('username').html( users[i].username )
      numberSpan = $('<span>').addClass('number').html('')

      newElement.append( userSpan )
      newElement.append( numberSpan )

      // almacenar ID de usuario en un atributo dentro del li
      newElement.attr('data-id', users[i].id )

      // si no somos nosotros,
      if( socket.id !== users[i].id ) {
         //añadir nuevo elemento li con jquery
         $('#users').append( newElement )
      }

   }

   setupUserButtons()

}

function showNewMessage( msg, classes ) {

   // crear nuevo elemento html: li
   newLi = $('<li>')
   // añadir clase "box"
   .addClass('box')
   .addClass( classes )
   // introducir mensaje como contenido:
   .html(msg)

   // añadimos el nuevo Li al final de la UL
   $('#messages').append(newLi)

}


function showMessages( messages ) {

   clearMessages()

   for( i in messages ) {

      newText = formatMessage( messages[i] )

      showNewMessage( newText, 'chat-message' );

   }

}

function updateUnreadNumber( userId ) {
   if(messages[userId].unread == 0 ) {
      html = ''
   } else {
      html = messages[userId].unread
   }
   $('#users li[data-id='+userId+'] .number').html( html )

}
