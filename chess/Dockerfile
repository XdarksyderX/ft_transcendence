# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: erivero- <erivero-@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/01/25 16:18:40 by jariza-o          #+#    #+#              #
#    Updated: 2025/02/26 13:17:19 by erivero-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM python:3.11-bookworm

COPY service/requirements.txt /service/requirements.txt

RUN pip install --no-cache-dir -r /service/requirements.txt

RUN apt-get update && apt-get install -y postgresql postgresql-contrib redis-server sudo

EXPOSE 5053
# EXPOSE 6379

COPY entrypoint.sh /entrypoint.sh
COPY dropdb.sh /dropdb.sh

RUN chmod +x /entrypoint.sh
RUN chmod +x /dropdb.sh
CMD ["/bin/bash", "/entrypoint.sh"]