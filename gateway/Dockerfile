# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: migarci2 <migarci2@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/09/23 22:44:12 by migarci2          #+#    #+#              #
#    Updated: 2024/09/23 23:02:01 by migarci2         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM nginx:1.21.1

COPY config/nginx.conf /etc/nginx/nginx.conf

COPY config/selfsigned.key /etc/nginx/selfsigned.key

COPY config/selfsigned.crt /etc/nginx/selfsigned.crt

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
