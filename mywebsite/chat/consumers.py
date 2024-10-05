import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from django.utils import timezone
from .models import Message

class ChatConsumer(WebsocketConsumer):

    def connect(self):
        self.id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = 'sala_chat_%s' % self.id
        self.user = self.scope['user']

        print('Conexión establecida al room_group_name' + self.room_group_name)
        print('Conexión establecida al channel_name' + self.channel_name)
        
        async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)
        self.accept()
    
    def disconnect(self, close_code):
        print('Se ha desconectado')
        async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)

    def receive(self, text_data):
        print('Mensaje recibido')

        try:
            text_data_json = json.loads(text_data)
            message = text_data_json['message']

            # Obtenemos el ID del usuario que envía el mensaje
            if self.scope['user'].is_authenticated:
                sender_id = self.scope['user'].id
            else:
                None

            if sender_id:
                # Grabamos la info en la Base de Datos
                message_save = Message.objects.create(user_id = sender_id, room_id = self.id, message = message)
                message_save.save()
                # Sincronizamos y enviamos el mensaje a la sala
                async_to_sync(self.channel_layer.group_send)(self.room_group_name, {
                    'type': 'chat_message',
                    'message': message,
                    'username': self.user.username,
                    'datetime': timezone.localtime(timezone.now()).strftime('%Y-%m-%d %H:%M:%S'),
                    'sender_id': sender_id,
                })
            else:
                print('Usuario no autenticado. Ignorando mensaje')

           
        except json.JSONDecodeError as e:
            print('Hubo un error al decodificar el JSON: ', e)
        except KeyError as e:
            print('Clave faltante en el JSON: ', e)
        except Exception as e:
            print('Error desconocido: ', e)

    def chat_message(self, event):
        message = event['message']
        username = event['username']
        datetime = event['datetime']
        sender_id = event['sender_id']

        current_user_id = self.scope['user'].id
        if sender_id != current_user_id:
            self.send(text_data = json.dumps({
                'message': message,
                'username': username,
                'datetime': datetime,
            }))

