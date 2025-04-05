# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jariza-o <jariza-o@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/01/25 16:18:40 by jariza-o          #+#    #+#              #
#    Updated: 2025/04/05 08:20:37 by jariza-o         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM python:3.11-bookworm

COPY service /service

RUN pip install --no-cache-dir -r /service/requirements.txt

RUN apt-get update && apt-get install -y postgresql postgresql-contrib redis-server sudo

EXPOSE 5053

COPY entrypoint.sh /entrypoint.sh
COPY dropdb.sh /dropdb.sh

RUN chmod +x /entrypoint.sh
RUN chmod +x /dropdb.sh
CMD ["/bin/bash", "/entrypoint.sh"]