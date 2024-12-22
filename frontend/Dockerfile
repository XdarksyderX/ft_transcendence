# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: erivero- <erivero-@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/05 16:11:12 by migarci2          #+#    #+#              #
#    Updated: 2024/12/12 19:54:15 by erivero-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM alpine:3.18

RUN apk update && apk add --no-cache lighttpd

RUN mkdir -p /var/www/service

COPY service/ /var/www/service

COPY lighttpd.conf /etc/lighttpd/lighttpd.conf

COPY entrypoint.sh /entrypoint.sh

EXPOSE 80

CMD ["/bin/sh", "/entrypoint.sh"]