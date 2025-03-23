# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jariza-o <jariza-o@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/08/29 16:03:17 by migarci2          #+#    #+#              #
#    Updated: 2025/03/23 18:20:52 by jariza-o         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM postgres:16.8-alpine3.21

RUN apk update && \
    apk add --no-cache python3 py3-pip sudo openrc

COPY service /service

RUN pip install --no-cache-dir --break-system-packages -r /service/requirements.txt

EXPOSE 5050

COPY entrypoint.sh /entrypoint.sh
COPY dropdb.sh /dropdb.sh

RUN chmod +x /entrypoint.sh
RUN chmod +x /dropdb.sh

CMD ["/bin/sh", "/entrypoint.sh"]

