# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: erivero- <erivero-@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/08/29 16:03:17 by migarci2          #+#    #+#              #
#    Updated: 2024/11/09 12:46:04 by erivero-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM python:3.11-bookworm

RUN apt-get update && apt-get install -y ncat

COPY service /service

RUN pip install --no-cache-dir -r /service/requirements.txt

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]
