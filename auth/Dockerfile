# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: erivero- <erivero-@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/08/29 16:03:17 by migarci2          #+#    #+#              #
#    Updated: 2025/03/20 14:46:43 by erivero-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM python:3.11-bookworm

RUN apt-get update && apt-get install -y postgresql postgresql-contrib sudo

COPY service /service

RUN pip install --no-cache-dir -r /service/requirements.txt

EXPOSE 5050

COPY entrypoint.sh /entrypoint.sh
COPY dropdb.sh /dropdb.sh

RUN chmod +x /entrypoint.sh
RUN chmod +x /dropdb.sh

CMD ["/bin/bash", "/entrypoint.sh"]
