# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: erivero- <erivero-@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/05 16:11:12 by migarci2          #+#    #+#              #
#    Updated: 2025/03/30 11:17:09 by erivero-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM alpine:3.18

RUN apk update && apk add --no-cache lighttpd bash

RUN mkdir -p /var/www/service

COPY service/ /var/www/service

COPY lighttpd.conf /etc/lighttpd/lighttpd.conf

COPY entrypoint.sh /entrypoint.sh

EXPOSE 80

CMD ["/bin/sh", "/entrypoint.sh"]