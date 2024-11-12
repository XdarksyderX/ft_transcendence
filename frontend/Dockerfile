# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: migarci2 <migarci2@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/11/05 16:11:12 by migarci2          #+#    #+#              #
#    Updated: 2024/11/12 19:16:52 by migarci2         ###   ########.fr        #
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